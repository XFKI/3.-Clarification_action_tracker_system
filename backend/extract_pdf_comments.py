#!/usr/bin/env python3
"""Extract PDF annotations/comments to Excel using PyMuPDF + pandas.

Usage:
  python backend/extract_pdf_comments.py --input "deepwell" --output "pdf_comments.xlsx"
  python backend/extract_pdf_comments.py --input "a.pdf" --output "a_comments.xlsx"
"""

from __future__ import annotations

import argparse
import importlib
import pathlib
from typing import Dict, List

import pandas as pd


def load_fitz():
    try:
        return importlib.import_module("fitz")
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "PyMuPDF is required. Install with: pip install pymupdf"
        ) from exc


def iter_pdf_files(input_path: pathlib.Path) -> List[pathlib.Path]:
    if input_path.is_file() and input_path.suffix.lower() == ".pdf":
        return [input_path]
    if input_path.is_dir():
        return sorted(p for p in input_path.rglob("*.pdf") if p.is_file())
    return []


def safe_str(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def extract_pdf_annotations(pdf_path: pathlib.Path) -> List[Dict[str, str]]:
    fitz = load_fitz()
    rows: List[Dict[str, str]] = []
    doc = fitz.open(pdf_path)
    try:
        for page_index in range(len(doc)):
            page = doc[page_index]
            annot = page.first_annot
            while annot:
                info = annot.info or {}
                content = safe_str(info.get("content") or info.get("subject") or info.get("title"))
                author = safe_str(info.get("title") or info.get("name"))
                created = safe_str(info.get("creationDate"))
                updated = safe_str(info.get("modDate"))
                annot_type = ""
                try:
                    annot_type = safe_str(annot.type[1])
                except Exception:
                    annot_type = ""

                rect = annot.rect
                bbox = f"{rect.x0:.2f},{rect.y0:.2f},{rect.x1:.2f},{rect.y1:.2f}"

                rows.append(
                    {
                        "pdf_file": pdf_path.name,
                        "pdf_path": str(pdf_path),
                        "page": page_index + 1,
                        "annotation_type": annot_type,
                        "author": author,
                        "content": content,
                        "created": created,
                        "updated": updated,
                        "bbox": bbox,
                    }
                )
                annot = annot.next
    finally:
        doc.close()
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract PDF comments/annotations to Excel")
    parser.add_argument("--input", required=True, help="Input PDF file or folder")
    parser.add_argument("--output", required=True, help="Output .xlsx or .csv file")
    args = parser.parse_args()

    input_path = pathlib.Path(args.input).expanduser().resolve()
    output_path = pathlib.Path(args.output).expanduser().resolve()

    pdf_files = iter_pdf_files(input_path)
    if not pdf_files:
        raise SystemExit(f"No PDF files found from input: {input_path}")

    all_rows: List[Dict[str, str]] = []
    for pdf in pdf_files:
        all_rows.extend(extract_pdf_annotations(pdf))

    df = pd.DataFrame(
        all_rows,
        columns=[
            "pdf_file",
            "pdf_path",
            "page",
            "annotation_type",
            "author",
            "content",
            "created",
            "updated",
            "bbox",
        ],
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.suffix.lower() == ".csv":
        df.to_csv(output_path, index=False, encoding="utf-8-sig")
    else:
        if output_path.suffix.lower() != ".xlsx":
            output_path = output_path.with_suffix(".xlsx")
        df.to_excel(output_path, index=False)

    print(f"Extracted {len(df)} annotations from {len(pdf_files)} PDF file(s).")
    print(f"Output: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
