"""
Reduces the triangle count of a Fusion/Creo-exported OBJ so it's lighter to
download once the site is hosted live (base64-embedded model data is the
biggest thing on any CAD model page).

Decimates each named group ("g ...") separately using quadric edge-collapse
(fast_simplification), so per-part material assignments (via "usemtl") are
preserved exactly — only geometry within each part is simplified, parts never
merge into each other. UV/normal data is dropped (unused: these models are
flat-shaded, no texture maps, and the viewer already regenerates normals with
computeVertexNormals() for anything missing them).

Usage:
    pip install fast-simplification numpy
    python scripts/simplify-obj.py <input.obj> <output.obj> [--target-reduction 0.7] [--min-faces 60]

target-reduction 0.7 means "remove ~70% of triangles" (keep ~30%).
"""
import argparse
import re
import sys

import numpy as np
import fast_simplification as fs


def parse_obj(path):
    """Returns (vertices: list[(x,y,z)], groups: list[{name, material, faces}])."""
    vertices = []
    groups = []
    current = None
    current_material = None

    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split()
            tag = parts[0]

            if tag == "v":
                vertices.append(tuple(float(x) for x in parts[1:4]))
            elif tag == "g":
                name = parts[1] if len(parts) > 1 else "group"
                current = {"name": name, "material": current_material, "faces": []}
                groups.append(current)
            elif tag == "usemtl":
                current_material = parts[1]
                if current is not None:
                    current["material"] = current_material
            elif tag == "f":
                # Each face token looks like "v", "v/vt", "v/vt/vn", or "v//vn".
                # Only the position index (before the first "/") matters here.
                idx = []
                for token in parts[1:]:
                    v_str = token.split("/")[0]
                    idx.append(int(v_str) - 1)  # OBJ indices are 1-based
                # Fan-triangulate anything that isn't already a triangle.
                for i in range(1, len(idx) - 1):
                    if current is None:
                        current = {"name": "default", "material": current_material, "faces": []}
                        groups.append(current)
                    current["faces"].append((idx[0], idx[i], idx[i + 1]))

    return vertices, groups


def simplify_group(vertices, faces, target_reduction, min_faces):
    if len(faces) < min_faces or target_reduction <= 0:
        local_verts = {}
        out_faces = []
        for tri in faces:
            out_tri = []
            for gi in tri:
                if gi not in local_verts:
                    local_verts[gi] = len(local_verts)
                out_tri.append(local_verts[gi])
            out_faces.append(out_tri)
        pts = np.zeros((len(local_verts), 3))
        for gi, li in local_verts.items():
            pts[li] = vertices[gi]
        return pts, np.array(out_faces, dtype=np.int64)

    used = sorted(set(i for tri in faces for i in tri))
    remap = {gi: li for li, gi in enumerate(used)}
    pts = np.array([vertices[gi] for gi in used], dtype=np.float64)
    tris = np.array([[remap[i] for i in tri] for tri in faces], dtype=np.int64)

    out_pts, out_faces = fs.simplify(pts, tris, target_reduction=target_reduction)
    return out_pts, out_faces


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--target-reduction", type=float, default=0.7)
    ap.add_argument("--min-faces", type=int, default=60)
    args = ap.parse_args()

    vertices, groups = parse_obj(args.input)
    total_in = sum(len(g["faces"]) for g in groups)

    # Find the mtllib line so the simplified file still points at the same materials.
    mtllib = None
    with open(args.input, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            if line.startswith("mtllib"):
                mtllib = line.strip()
                break

    out_lines = ["# Simplified via scripts/simplify-obj.py "
                 f"(target_reduction={args.target_reduction})", ""]
    if mtllib:
        out_lines += [mtllib, ""]

    offset = 0
    total_out = 0
    for g in groups:
        if not g["faces"]:
            continue
        pts, faces = simplify_group(vertices, g["faces"], args.target_reduction, args.min_faces)
        out_lines.append(f"g {g['name']}")
        for p in pts:
            out_lines.append("v %.6f %.6f %.6f" % tuple(p))
        if g["material"]:
            out_lines.append(f"usemtl {g['material']}")
        for tri in faces:
            a, b, c = (int(i) + offset + 1 for i in tri)
            out_lines.append(f"f {a} {b} {c}")
        offset += len(pts)
        total_out += len(faces)
        print(f"  {g['name']:<20} {len(g['faces']):>7} -> {len(faces):>7} faces")

    with open(args.output, "w", encoding="utf-8") as f:
        f.write("\n".join(out_lines) + "\n")

    pct = 100 * (1 - total_out / total_in) if total_in else 0
    print(f"\nTotal: {total_in} -> {total_out} faces ({pct:.1f}% reduction)")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    sys.exit(main())
