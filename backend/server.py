#!/usr/bin/env python3
import argparse
import base64
import importlib
import json
import os
import sqlite3
import threading
import time
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(ROOT_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "tracker.db")
ACTIVE_CLIENTS = {}
CLIENT_LOCK = threading.Lock()
LAST_ACTIVITY = time.time()
HAD_CLIENT = False
CLIENT_STALE_SECONDS = 20
IDLE_SHUTDOWN_SECONDS = 25


def now_iso() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def default_state() -> dict:
    return {
        "clarifications": [],
        "actions": [],
        "meetings": [],
        "trash": [],
        "options": {
            "disciplineOptions": [],
            "typeOptions": [],
            "actionByOptions": [],
            "sourceOptions": [],
            "columnWidthMap": {},
        },
        "meta": {},
    }


def ensure_db() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS project_state (
                project_id TEXT PRIMARY KEY,
                state_json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS app_meta (
                key TEXT PRIMARY KEY,
                value_json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS attachment_store (
                project_id TEXT NOT NULL,
                att_id TEXT NOT NULL,
                name TEXT,
                mime_type TEXT,
                size INTEGER,
                data_url TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY(project_id, att_id)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS fs_mapping (
                project_id TEXT NOT NULL,
                package_name TEXT NOT NULL,
                root_path TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY(project_id, package_name)
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def db_read_meta() -> dict:
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute("SELECT value_json FROM app_meta WHERE key = ?", ("projects_meta",))
        row = cur.fetchone()
        if not row:
            return {"projects": [], "activeProjectId": ""}
        return json.loads(row[0])
    finally:
        conn.close()


def db_write_meta(payload: dict) -> None:
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO app_meta(key, value_json, updated_at)
            VALUES(?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
              value_json=excluded.value_json,
              updated_at=excluded.updated_at
            """,
            ("projects_meta", json.dumps(payload, ensure_ascii=False), now_iso()),
        )
        conn.commit()
    finally:
        conn.close()


def db_read_state(project_id: str) -> dict:
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT state_json, updated_at FROM project_state WHERE project_id = ?",
            (project_id,),
        )
        row = cur.fetchone()
        if not row:
            return {"exists": False, "state": None, "updatedAt": None}
        state_obj = json.loads(row[0])
        hydrate_state_attachments(project_id, state_obj)
        return {
            "exists": True,
            "state": state_obj,
            "updatedAt": row[1],
        }
    finally:
        conn.close()


def _read_state_row(conn: sqlite3.Connection, project_id: str):
    cur = conn.cursor()
    cur.execute("SELECT state_json FROM project_state WHERE project_id = ?", (project_id,))
    row = cur.fetchone()
    if not row:
        return default_state()
    return json.loads(row[0])


def _write_state_row(conn: sqlite3.Connection, project_id: str, state_obj: dict) -> None:
    normalized = json.loads(json.dumps(state_obj, ensure_ascii=False))
    persist_state_attachments(conn, project_id, normalized)
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO project_state(project_id, state_json, updated_at)
        VALUES(?, ?, ?)
        ON CONFLICT(project_id) DO UPDATE SET
          state_json=excluded.state_json,
          updated_at=excluded.updated_at
        """,
        (project_id, json.dumps(normalized, ensure_ascii=False), now_iso()),
    )


def db_write_state(project_id: str, state_obj: dict) -> None:
    conn = sqlite3.connect(DB_PATH)
    try:
        _write_state_row(conn, project_id, state_obj)
        conn.commit()
    finally:
        conn.close()


def _iter_items_for_attachment(state_obj: dict):
    for item in state_obj.get("clarifications", []) or []:
        yield item
    for item in state_obj.get("meetings", []) or []:
        yield item
    for tr in state_obj.get("trash", []) or []:
        if isinstance(tr, dict) and isinstance(tr.get("item"), dict):
            yield tr["item"]


def persist_state_attachments(conn: sqlite3.Connection, project_id: str, state_obj: dict) -> None:
    cur = conn.cursor()
    for item in _iter_items_for_attachment(state_obj):
        fmap = item.get("fieldAttachments") or {}
        for _, arr in list(fmap.items()):
            if not isinstance(arr, list):
                continue
            for att in arr:
                if not isinstance(att, dict):
                    continue
                att_id = str(att.get("id") or "").strip()
                data_url = att.get("data")
                if not att_id:
                    continue
                if isinstance(data_url, str) and data_url:
                    cur.execute(
                        """
                        INSERT INTO attachment_store(project_id, att_id, name, mime_type, size, data_url, updated_at)
                        VALUES(?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(project_id, att_id) DO UPDATE SET
                          name=excluded.name,
                          mime_type=excluded.mime_type,
                          size=excluded.size,
                          data_url=excluded.data_url,
                          updated_at=excluded.updated_at
                        """,
                        (
                            project_id,
                            att_id,
                            att.get("name") or "attachment",
                            att.get("type") or "application/octet-stream",
                            int(att.get("size") or 0),
                            data_url,
                            now_iso(),
                        ),
                    )
                att.pop("data", None)
                att["storage"] = "db"


def _list_with_key(state_obj: dict, collection: str):
    arr = state_obj.get(collection) or []
    key = "trashId" if collection == "trash" else "id"
    if not isinstance(arr, list):
        arr = []
    return arr, key


def _find_index(arr: list, key_field: str, key_val: str) -> int:
    for idx, item in enumerate(arr):
        if isinstance(item, dict) and str(item.get(key_field) or "") == key_val:
            return idx
    return -1


def db_apply_patches(project_id: str, patches: list) -> dict:
    conn = sqlite3.connect(DB_PATH)
    try:
        state_obj = _read_state_row(conn, project_id)
        options_obj = state_obj.get("options") if isinstance(state_obj.get("options"), dict) else {}
        meta_obj = state_obj.get("meta") if isinstance(state_obj.get("meta"), dict) else {}
        state_obj["options"] = options_obj
        state_obj["meta"] = meta_obj
        changed = False
        for patch in patches or []:
            if not isinstance(patch, dict):
                continue
            op = str(patch.get("op") or "").strip()
            if op == "set_meta":
                values = patch.get("values") or {}
                if isinstance(values, dict):
                    meta_obj.update(values)
                    changed = True
                continue
            if op == "set_options":
                values = patch.get("values") or {}
                if isinstance(values, dict):
                    options_obj.update(values)
                    changed = True
                continue
            collection = str(patch.get("collection") or "").strip()
            if collection not in ("clarifications", "actions", "meetings", "trash"):
                continue
            arr, key_field = _list_with_key(state_obj, collection)
            state_obj[collection] = arr
            if op == "upsert_item":
                item = patch.get("item")
                if not isinstance(item, dict):
                    continue
                key_val = str(item.get(key_field) or "").strip()
                if not key_val:
                    continue
                idx = _find_index(arr, key_field, key_val)
                if idx >= 0:
                    arr[idx] = item
                else:
                    arr.append(item)
                changed = True
                continue
            if op == "remove_item":
                key_val = str(patch.get("id") or "").strip()
                if not key_val:
                    continue
                idx = _find_index(arr, key_field, key_val)
                if idx >= 0:
                    arr.pop(idx)
                    changed = True
                continue
            if op == "patch_item":
                key_val = str(patch.get("id") or "").strip()
                if not key_val:
                    continue
                idx = _find_index(arr, key_field, key_val)
                if idx < 0:
                    continue
                set_map = patch.get("set") or {}
                unset_keys = patch.get("unset") or []
                if isinstance(set_map, dict):
                    arr[idx].update(set_map)
                    changed = True
                if isinstance(unset_keys, list):
                    for k in unset_keys:
                        if isinstance(k, str) and k in arr[idx]:
                            arr[idx].pop(k, None)
                            changed = True
                continue
        if changed:
            _write_state_row(conn, project_id, state_obj)
        conn.commit()
        return {"ok": True, "applied": len(patches or [])}
    finally:
        conn.close()


def db_batch_update(project_id: str, source_type: str, ids: list, updates: dict) -> dict:
    if source_type not in ("clarification", "meeting", "action"):
        return {"ok": False, "error": "invalid sourceType"}
    collection = {
        "clarification": "clarifications",
        "meeting": "meetings",
        "action": "actions",
    }[source_type]
    id_set = {str(x) for x in (ids or []) if str(x).strip()}
    if not id_set:
        return {"ok": True, "updated": 0}
    conn = sqlite3.connect(DB_PATH)
    try:
        state_obj = _read_state_row(conn, project_id)
        arr = state_obj.get(collection) or []
        updated = 0
        for item in arr:
            if not isinstance(item, dict):
                continue
            if str(item.get("id") or "") not in id_set:
                continue
            for k, v in (updates or {}).items():
                item[k] = v
            updated += 1
        _write_state_row(conn, project_id, state_obj)
        conn.commit()
        return {"ok": True, "updated": updated}
    finally:
        conn.close()


def db_batch_delete(project_id: str, source_type: str, ids: list) -> dict:
    if source_type not in ("clarification", "meeting", "action"):
        return {"ok": False, "error": "invalid sourceType"}
    collection = {
        "clarification": "clarifications",
        "meeting": "meetings",
        "action": "actions",
    }[source_type]
    id_set = {str(x) for x in (ids or []) if str(x).strip()}
    if not id_set:
        return {"ok": True, "moved": 0}
    conn = sqlite3.connect(DB_PATH)
    try:
        state_obj = _read_state_row(conn, project_id)
        src = state_obj.get(collection) or []
        trash = state_obj.get("trash") or []
        keep = []
        moved = 0
        for item in src:
            if not isinstance(item, dict):
                keep.append(item)
                continue
            if str(item.get("id") or "") in id_set:
                moved += 1
                trash.insert(0, {
                    "trashId": f"tr_{int(time.time()*1000)}_{moved}",
                    "sourceType": source_type,
                    "deletedAt": now_iso(),
                    "item": item,
                })
            else:
                keep.append(item)
        state_obj[collection] = keep
        state_obj["trash"] = trash
        _write_state_row(conn, project_id, state_obj)
        conn.commit()
        return {"ok": True, "moved": moved}
    finally:
        conn.close()


def db_clear_project(project_id: str) -> dict:
    conn = sqlite3.connect(DB_PATH)
    try:
        state_obj = _read_state_row(conn, project_id)
        trash = state_obj.get("trash") or []
        moved = 0
        for source_type, key in (("clarification", "clarifications"), ("meeting", "meetings"), ("action", "actions")):
            for item in state_obj.get(key) or []:
                moved += 1
                trash.insert(0, {
                    "trashId": f"tr_{int(time.time()*1000)}_{moved}",
                    "sourceType": source_type,
                    "deletedAt": now_iso(),
                    "item": item,
                })
            state_obj[key] = []
        state_obj["trash"] = trash
        _write_state_row(conn, project_id, state_obj)
        conn.commit()
        return {"ok": True, "moved": moved}
    finally:
        conn.close()


def db_clear_all() -> dict:
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM project_state")
        cur.execute("DELETE FROM attachment_store")
        cur.execute(
            """
            INSERT INTO app_meta(key, value_json, updated_at)
            VALUES(?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
              value_json=excluded.value_json,
              updated_at=excluded.updated_at
            """,
            ("projects_meta", json.dumps({"projects": [], "activeProjectId": ""}, ensure_ascii=False), now_iso()),
        )
        conn.commit()
        cur.execute("VACUUM")
        return {"ok": True, "vacuumed": True}
    finally:
        conn.close()


def db_storage_stats(project_id: str) -> dict:
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute("SELECT length(state_json) FROM project_state WHERE project_id = ?", (project_id,))
        row = cur.fetchone()
        structured_bytes = int(row[0] or 0) if row else 0
        cur.execute(
            "SELECT COUNT(*), COALESCE(SUM(size),0) FROM attachment_store WHERE project_id = ?",
            (project_id,),
        )
        c_row = cur.fetchone() or (0, 0)
        att_count = int(c_row[0] or 0)
        att_bytes = int(c_row[1] or 0)
        cur.execute(
            """
            SELECT att_id, name, size
            FROM attachment_store
            WHERE project_id = ?
            ORDER BY size DESC, updated_at DESC
            LIMIT 30
            """,
            (project_id,),
        )
        top = [
            {"attId": str(r[0] or ""), "name": str(r[1] or "attachment"), "size": int(r[2] or 0)}
            for r in cur.fetchall()
        ]
        db_file_bytes = os.path.getsize(DB_PATH) if os.path.exists(DB_PATH) else 0
        return {
            "ok": True,
            "structuredBytes": structured_bytes,
            "attachmentBytes": att_bytes,
            "attachmentCount": att_count,
            "dbFileBytes": db_file_bytes,
            "topAttachments": top,
        }
    finally:
        conn.close()


def hydrate_state_attachments(project_id: str, state_obj: dict) -> None:
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        for item in _iter_items_for_attachment(state_obj):
            fmap = item.get("fieldAttachments") or {}
            for _, arr in list(fmap.items()):
                if not isinstance(arr, list):
                    continue
                for att in arr:
                    if not isinstance(att, dict):
                        continue
                    att_id = str(att.get("id") or "").strip()
                    if not att_id:
                        continue
                    cur.execute(
                        "SELECT data_url, mime_type, name, size FROM attachment_store WHERE project_id = ? AND att_id = ?",
                        (project_id, att_id),
                    )
                    row = cur.fetchone()
                    if not row:
                        continue
                    data_url, mime_type, name, size = row
                    att["data"] = data_url
                    att["type"] = mime_type or att.get("type")
                    att["name"] = name or att.get("name")
                    att["size"] = size or att.get("size")
                    att["storage"] = "db"
    finally:
        conn.close()


def db_read_attachment(project_id: str, att_id: str):
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT data_url, mime_type, name, size FROM attachment_store WHERE project_id = ? AND att_id = ?",
            (project_id, att_id),
        )
        row = cur.fetchone()
        if not row:
            return None
        return {
            "data": row[0],
            "type": row[1],
            "name": row[2],
            "size": row[3],
        }
    finally:
        conn.close()


def db_set_fs_mapping(project_id: str, package_name: str, root_path: str) -> dict:
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO fs_mapping(project_id, package_name, root_path, updated_at)
            VALUES(?, ?, ?, ?)
            ON CONFLICT(project_id, package_name) DO UPDATE SET
              root_path=excluded.root_path,
              updated_at=excluded.updated_at
            """,
            (project_id, package_name, root_path, now_iso()),
        )
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()


def db_get_fs_mappings(project_id: str) -> list:
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT package_name, root_path, updated_at FROM fs_mapping WHERE project_id = ? ORDER BY package_name COLLATE NOCASE",
            (project_id,),
        )
        rows = cur.fetchall()
        return [
            {"packageName": str(r[0] or ""), "rootPath": str(r[1] or ""), "updatedAt": str(r[2] or "")}
            for r in rows
        ]
    finally:
        conn.close()


def db_get_fs_mapping(project_id: str, package_name: str):
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT root_path FROM fs_mapping WHERE project_id = ? AND package_name = ?",
            (project_id, package_name),
        )
        row = cur.fetchone()
        return str(row[0]) if row and row[0] else None
    finally:
        conn.close()


def _safe_real_path(base_dir: str, relative_path: str):
    base_real = os.path.realpath(base_dir)
    target_real = os.path.realpath(os.path.join(base_real, relative_path))
    try:
        common = os.path.commonpath([base_real, target_real])
    except ValueError:
        return None
    if common != base_real:
        return None
    return target_real


def fs_index_folder(root_path: str, max_files: int = 6000) -> list:
    out = []
    root_real = os.path.realpath(root_path)
    if not os.path.isdir(root_real):
        return out
    for cur_root, _, files in os.walk(root_real):
        for fn in files:
            if len(out) >= max_files:
                return out
            abs_path = os.path.join(cur_root, fn)
            try:
                st = os.stat(abs_path)
            except OSError:
                continue
            rel = os.path.relpath(abs_path, root_real).replace("\\", "/")
            out.append(
                {
                    "relativePath": rel,
                    "fileName": fn,
                    "size": int(st.st_size or 0),
                    "mtime": int(st.st_mtime or 0),
                }
            )
    return out


def _guess_mime(path: str) -> str:
    lower = path.lower()
    if lower.endswith(".pdf"):
        return "application/pdf"
    if lower.endswith(".xlsx"):
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    if lower.endswith(".xls"):
        return "application/vnd.ms-excel"
    if lower.endswith(".csv"):
        return "text/csv"
    if lower.endswith(".txt"):
        return "text/plain"
    return "application/octet-stream"


def _decode_pdf_literal(raw: str) -> str:
    out = raw.replace(r"\r", " ").replace(r"\n", " ").replace(r"\t", " ")
    out = out.replace(r"\)", ")").replace(r"\(", "(").replace(r"\\", "\\")
    return " ".join(out.split()).strip()


def _load_fitz():
    try:
        return importlib.import_module("fitz")
    except Exception:
        return None


def _annotation_text_candidates(annot, info: dict) -> list:
    candidates = []
    candidates.append(info.get("content"))
    # Some tools store comment text in subject/title or inside annot rich text.
    candidates.append(info.get("subject"))
    candidates.append(info.get("title"))
    try:
        get_text = getattr(annot, "get_text", None)
        if callable(get_text):
            candidates.append(get_text("text"))
    except Exception:
        pass
    return candidates


def _pick_annotation_text(annot, info: dict) -> str:
    for raw in _annotation_text_candidates(annot, info):
        txt = " ".join(str(raw or "").split()).strip()
        if txt:
            return txt
    return ""


def _extract_comments_pymupdf(data: bytes, limit: int = 200) -> list:
    fitz = _load_fitz()
    if fitz is None:
        return []
    comments = []
    doc = None
    try:
        doc = fitz.open(stream=data, filetype="pdf")
        for page_index in range(len(doc)):
            page = doc[page_index]
            annot = page.first_annot
            while annot:
                next_annot = annot.next
                try:
                    info = annot.info or {}
                    a_type = ""
                    try:
                        a_type = str(annot.type[1] or "")
                    except Exception:
                        a_type = ""
                    if a_type.strip().lower() == "line":
                        continue
                    text = _pick_annotation_text(annot, info)
                    if text:
                        comments.append(text)
                        if len(comments) >= limit:
                            return comments
                except Exception:
                    # Skip problematic annotation and continue extraction.
                    pass
                finally:
                    annot = next_annot
    except Exception:
        return []
    finally:
        if doc is not None:
            try:
                doc.close()
            except Exception:
                pass
    return comments


def _extract_comment_details_pymupdf(data: bytes, limit: int = 400) -> list:
    fitz = _load_fitz()
    if fitz is None:
        return []
    details = []
    doc = None
    try:
        doc = fitz.open(stream=data, filetype="pdf")
        for page_index in range(len(doc)):
            page = doc[page_index]
            annot = page.first_annot
            while annot:
                next_annot = annot.next
                try:
                    info = annot.info or {}
                    a_type = ""
                    try:
                        a_type = str(annot.type[1] or "")
                    except Exception:
                        a_type = ""
                    if a_type.strip().lower() == "line":
                        continue
                    text = _pick_annotation_text(annot, info)
                    if text:
                        details.append(
                            {
                                "text": text,
                                "page": int(page_index + 1),
                                "author": str(info.get("title") or info.get("name") or "").strip(),
                                "created": str(info.get("creationDate") or "").strip(),
                                "updated": str(info.get("modDate") or "").strip(),
                                "annotationType": a_type.strip(),
                            }
                        )
                        if len(details) >= limit:
                            return details
                except Exception:
                    # Skip problematic annotation and continue extraction.
                    pass
                finally:
                    annot = next_annot
    except Exception:
        return []
    finally:
        if doc is not None:
            try:
                doc.close()
            except Exception:
                pass
    return details


def extract_pdf_comment_records_bytes(data: bytes, limit: int = 400) -> list:
    details = _extract_comment_details_pymupdf(data, limit=limit)
    if details:
        return details
    out = []
    for c in extract_pdf_comments_bytes(data, limit=limit):
        out.append(
            {
                "text": str(c),
                "page": 0,
                "author": "",
                "created": "",
                "updated": "",
                "annotationType": "",
            }
        )
    return out


def extract_pdf_comments_bytes(data: bytes, limit: int = 200) -> list:
    py_comments = _extract_comments_pymupdf(data, limit=limit)
    if py_comments:
        return py_comments
    comments = []
    try:
        txt = data.decode("latin1", errors="ignore")
    except Exception:
        txt = ""
    import re

    for m in re.finditer(r"/Contents\s*\(([^)]{1,1200})\)", txt):
        c = _decode_pdf_literal(m.group(1) or "")
        if c and len(c) > 2:
            comments.append(c)
            if len(comments) >= limit:
                return comments

    for m in re.finditer(r"/Contents\s*<([0-9A-Fa-f]{8,2400})>", txt):
        h = (m.group(1) or "").strip()
        if len(h) % 2 != 0:
            continue
        try:
            b = bytes.fromhex(h)
        except Exception:
            continue
        c = ""
        try:
            if b.startswith(b"\xfe\xff") or b.startswith(b"\xff\xfe"):
                c = b.decode("utf-16", errors="ignore")
            else:
                c = b.decode("utf-8", errors="ignore")
        except Exception:
            c = ""
        c = " ".join(c.split()).strip()
        if c and len(c) > 2:
            comments.append(c)
            if len(comments) >= limit:
                return comments

    return comments


def register_client(client_id: str) -> None:
    global LAST_ACTIVITY, HAD_CLIENT
    now_ts = time.time()
    with CLIENT_LOCK:
        ACTIVE_CLIENTS[client_id] = now_ts
        HAD_CLIENT = True
        LAST_ACTIVITY = now_ts


def heartbeat_client(client_id: str) -> None:
    global LAST_ACTIVITY
    now_ts = time.time()
    with CLIENT_LOCK:
        if client_id in ACTIVE_CLIENTS:
            ACTIVE_CLIENTS[client_id] = now_ts
            LAST_ACTIVITY = now_ts


def unregister_client(client_id: str) -> None:
    with CLIENT_LOCK:
        if client_id in ACTIVE_CLIENTS:
            ACTIVE_CLIENTS.pop(client_id, None)


def _prune_stale_clients() -> int:
    global LAST_ACTIVITY
    now_ts = time.time()
    with CLIENT_LOCK:
        stale = [cid for cid, ts in ACTIVE_CLIENTS.items() if now_ts - ts > CLIENT_STALE_SECONDS]
        for cid in stale:
            ACTIVE_CLIENTS.pop(cid, None)
        count = len(ACTIVE_CLIENTS)
        if count > 0:
            LAST_ACTIVITY = now_ts
        return count


def start_idle_shutdown_watcher(server: ThreadingHTTPServer) -> None:
    def _watch() -> None:
        while True:
            time.sleep(3)
            active_count = _prune_stale_clients()
            if not HAD_CLIENT:
                continue
            idle_for = time.time() - LAST_ACTIVITY
            if active_count == 0 and idle_for > IDLE_SHUTDOWN_SECONDS:
                print("[backend] No active UI clients, shutting down automatically.")
                try:
                    server.shutdown()
                except Exception:
                    pass
                return

    th = threading.Thread(target=_watch, daemon=True)
    th.start()


class TrackerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def _send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file_bytes(self, file_path: str, mime_type: str = "application/octet-stream") -> None:
        with open(file_path, "rb") as fp:
            data = fp.read()
        self.send_response(200)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0") or "0")
        raw = self.rfile.read(length) if length > 0 else b"{}"
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            return self._send_json({
                "ok": True,
                "mode": "sqlite",
                "dbPath": DB_PATH,
                "forcedBackend": True,
            })
        if parsed.path == "/api/meta":
            return self._send_json(db_read_meta())
        if parsed.path == "/api/state":
            project_id = parse_qs(parsed.query).get("projectId", [""])[0].strip()
            if not project_id:
                return self._send_json({"error": "projectId required"}, 400)
            return self._send_json(db_read_state(project_id))
        if parsed.path == "/api/attachment":
            project_id = parse_qs(parsed.query).get("projectId", [""])[0].strip()
            att_id = parse_qs(parsed.query).get("attId", [""])[0].strip()
            if not project_id or not att_id:
                return self._send_json({"error": "projectId and attId required"}, 400)
            data = db_read_attachment(project_id, att_id)
            if not data:
                return self._send_json({"error": "attachment not found"}, 404)
            return self._send_json({"ok": True, **data})
        if parsed.path == "/api/storage/stats":
            project_id = parse_qs(parsed.query).get("projectId", [""])[0].strip()
            if not project_id:
                return self._send_json({"error": "projectId required"}, 400)
            return self._send_json(db_storage_stats(project_id))
        if parsed.path == "/api/fs/map":
            project_id = parse_qs(parsed.query).get("projectId", [""])[0].strip()
            if not project_id:
                return self._send_json({"error": "projectId required"}, 400)
            return self._send_json({"ok": True, "mappings": db_get_fs_mappings(project_id)})
        if parsed.path == "/api/fs/open":
            project_id = parse_qs(parsed.query).get("projectId", [""])[0].strip()
            package_name = parse_qs(parsed.query).get("packageName", [""])[0].strip()
            rel_path = parse_qs(parsed.query).get("relativePath", [""])[0].strip()
            if not project_id or not package_name or not rel_path:
                return self._send_json({"error": "projectId/packageName/relativePath required"}, 400)
            root_path = db_get_fs_mapping(project_id, package_name)
            if not root_path:
                return self._send_json({"error": "mapping not found"}, 404)
            target = _safe_real_path(root_path, rel_path)
            if not target or not os.path.isfile(target):
                return self._send_json({"error": "file not found"}, 404)
            return self._send_file_bytes(target, _guess_mime(target))
        if parsed.path == "/api/fs/pdf-comments":
            project_id = parse_qs(parsed.query).get("projectId", [""])[0].strip()
            package_name = parse_qs(parsed.query).get("packageName", [""])[0].strip()
            rel_path = parse_qs(parsed.query).get("relativePath", [""])[0].strip()
            if not project_id or not package_name or not rel_path:
                return self._send_json({"error": "projectId/packageName/relativePath required"}, 400)
            root_path = db_get_fs_mapping(project_id, package_name)
            if not root_path:
                return self._send_json({"error": "mapping not found"}, 404)
            target = _safe_real_path(root_path, rel_path)
            if not target or not os.path.isfile(target):
                return self._send_json({"error": "file not found"}, 404)
            if not target.lower().endswith(".pdf"):
                return self._send_json({"error": "only pdf supported"}, 400)
            with open(target, "rb") as fp:
                data = fp.read()
            comment_details = extract_pdf_comment_records_bytes(data)
            comments = [str(x.get("text") or "") for x in comment_details if str(x.get("text") or "").strip()]
            return self._send_json({"ok": True, "comments": comments, "commentDetails": comment_details})
        return super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/client/register":
            try:
                payload = self._read_json()
                client_id = (payload.get("clientId") or "").strip()
                if not client_id:
                    return self._send_json({"error": "clientId required"}, 400)
                register_client(client_id)
                return self._send_json({"ok": True})
            except Exception as exc:
                return self._send_json({"error": str(exc)}, 500)

        if parsed.path == "/api/client/heartbeat":
            try:
                payload = self._read_json()
                client_id = (payload.get("clientId") or "").strip()
                if not client_id:
                    return self._send_json({"error": "clientId required"}, 400)
                heartbeat_client(client_id)
                return self._send_json({"ok": True})
            except Exception as exc:
                return self._send_json({"error": str(exc)}, 500)

        if parsed.path == "/api/client/unregister":
            try:
                payload = self._read_json()
                client_id = (payload.get("clientId") or "").strip()
                if client_id:
                    unregister_client(client_id)
                return self._send_json({"ok": True})
            except Exception as exc:
                return self._send_json({"error": str(exc)}, 500)

        if parsed.path == "/api/meta":
            try:
                payload = self._read_json()
                projects = payload.get("projects") or []
                active_project_id = payload.get("activeProjectId") or ""
                db_write_meta({"projects": projects, "activeProjectId": active_project_id})
                return self._send_json({"ok": True})
            except Exception as exc:
                return self._send_json({"error": str(exc)}, 500)

        if parsed.path == "/api/state":
            project_id = parse_qs(parsed.query).get("projectId", [""])[0].strip()
            if not project_id:
                return self._send_json({"error": "projectId required"}, 400)
            try:
                payload = self._read_json()
                db_write_state(project_id, payload)
                return self._send_json({"ok": True})
            except Exception as exc:
                return self._send_json({"error": str(exc)}, 500)

        if parsed.path == "/api/state/patch":
            project_id = parse_qs(parsed.query).get("projectId", [""])[0].strip()
            if not project_id:
                return self._send_json({"error": "projectId required"}, 400)
            try:
                payload = self._read_json()
                patches = payload.get("patches") or []
                return self._send_json(db_apply_patches(project_id, patches))
            except Exception as exc:
                return self._send_json({"error": str(exc)}, 500)

        if parsed.path == "/api/ops/batch-update":
            try:
                payload = self._read_json()
                project_id = str(payload.get("projectId") or "").strip()
                source_type = str(payload.get("sourceType") or "").strip()
                ids = payload.get("ids") or []
                updates = payload.get("updates") or {}
                if not project_id:
                    return self._send_json({"error": "projectId required"}, 400)
                out = db_batch_update(project_id, source_type, ids, updates)
                status = 200 if out.get("ok") else 400
                return self._send_json(out, status)
            except Exception as exc:
                return self._send_json({"error": str(exc)}, 500)

        if parsed.path == "/api/ops/batch-delete":
            try:
                payload = self._read_json()
                project_id = str(payload.get("projectId") or "").strip()
                source_type = str(payload.get("sourceType") or "").strip()
                ids = payload.get("ids") or []
                if not project_id:
                    return self._send_json({"error": "projectId required"}, 400)
                out = db_batch_delete(project_id, source_type, ids)
                status = 200 if out.get("ok") else 400
                return self._send_json(out, status)
            except Exception as exc:
                return self._send_json({"error": str(exc)}, 500)

        if parsed.path == "/api/ops/clear-project":
            try:
                payload = self._read_json()
                project_id = str(payload.get("projectId") or "").strip()
                if not project_id:
                    return self._send_json({"error": "projectId required"}, 400)
                return self._send_json(db_clear_project(project_id))
            except Exception as exc:
                return self._send_json({"error": str(exc)}, 500)

        if parsed.path == "/api/ops/clear-all":
            try:
                return self._send_json(db_clear_all())
            except Exception as exc:
                return self._send_json({"error": str(exc)}, 500)

        if parsed.path == "/api/fs/map":
            try:
                payload = self._read_json()
                project_id = str(payload.get("projectId") or "").strip()
                package_name = str(payload.get("packageName") or "").strip()
                root_path = str(payload.get("rootPath") or "").strip()
                if not project_id or not package_name or not root_path:
                    return self._send_json({"error": "projectId/packageName/rootPath required"}, 400)
                if not os.path.isdir(root_path):
                    return self._send_json({"error": "rootPath not found"}, 400)
                out = db_set_fs_mapping(project_id, package_name, os.path.realpath(root_path))
                return self._send_json(out)
            except Exception as exc:
                return self._send_json({"error": str(exc)}, 500)

        if parsed.path == "/api/fs/index":
            try:
                payload = self._read_json()
                project_id = str(payload.get("projectId") or "").strip()
                package_name = str(payload.get("packageName") or "").strip()
                root_path = str(payload.get("rootPath") or "").strip()
                if not project_id or not package_name:
                    return self._send_json({"error": "projectId/packageName required"}, 400)
                if root_path:
                    if not os.path.isdir(root_path):
                        return self._send_json({"error": "rootPath not found"}, 400)
                    db_set_fs_mapping(project_id, package_name, os.path.realpath(root_path))
                else:
                    root_path = db_get_fs_mapping(project_id, package_name) or ""
                    if not root_path:
                        return self._send_json({"error": "mapping not found, please provide rootPath"}, 400)
                files = fs_index_folder(root_path)
                return self._send_json({"ok": True, "rootPath": root_path, "files": files})
            except Exception as exc:
                return self._send_json({"error": str(exc)}, 500)

        if parsed.path == "/api/pdf-comments/extract":
            try:
                payload = self._read_json()
                file_base64 = str(payload.get("fileBase64") or "").strip()
                if not file_base64:
                    return self._send_json({"error": "fileBase64 required"}, 400)
                try:
                    data = base64.b64decode(file_base64, validate=True)
                except Exception:
                    return self._send_json({"error": "invalid fileBase64"}, 400)
                if not data:
                    return self._send_json({"error": "empty file content"}, 400)
                if len(data) > 40 * 1024 * 1024:
                    return self._send_json({"error": "file too large (>40MB)"}, 400)
                comment_details = extract_pdf_comment_records_bytes(data)
                comments = [str(x.get("text") or "") for x in comment_details if str(x.get("text") or "").strip()]
                return self._send_json({"ok": True, "comments": comments, "commentDetails": comment_details})
            except Exception as exc:
                return self._send_json({"error": str(exc)}, 500)

        return self._send_json({"error": "Not found"}, 404)


def main() -> None:
    parser = argparse.ArgumentParser(description="Local backend for Clarification Action Tracker")
    parser.add_argument("--port", type=int, default=5500)
    args = parser.parse_args()

    ensure_db()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), TrackerHandler)
    start_idle_shutdown_watcher(server)
    print(f"[backend] Serving on http://127.0.0.1:{args.port}/index.html")
    print(f"[backend] SQLite DB: {DB_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
