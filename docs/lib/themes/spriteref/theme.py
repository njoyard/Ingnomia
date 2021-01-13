import os
import shutil
from jinja2 import Environment, FileSystemLoader

from ...db import db
from ...util import DOCDIR, sprite_rect, empty

THEME_PATH = os.path.dirname(__file__)
ASSET_PATH = os.path.join(THEME_PATH, "assets")
TEMPLATE_PATH = os.path.join(THEME_PATH, "templates")
CONTENT_PATH = os.path.realpath(os.path.join(DOCDIR, "..", "content"))


class SpriteRefTheme:
    assets = []

    def __init__(self):
        self.assets = os.listdir(ASSET_PATH)
        self.env = Environment(loader=FileSystemLoader(TEMPLATE_PATH))

    def render(self, output, build_id):
        # Setup directories
        shutil.rmtree(output, ignore_errors=True)

        for subdir in ["assets"]:
            os.makedirs(os.path.join(output, subdir))

        basesprites = [
            {"id": id, "tilesheet": tilesheet, "rect": sprite_rect(rect)}
            for id in db.basesprites()
            for (rect, tilesheet) in [db.basesprite(id)]
        ]

        for id in set([bs["id"] for bs in basesprites]):
            matches = [bs for bs in basesprites if bs["id"] == id]
            if len(matches) > 1:
                print(f"Duplicate BaseSprite: {id} ({len(matches)} copies)")

        uses = {bs["id"]: [] for bs in basesprites}

        for id in db.sprites():
            (offset, base, tint) = db.sprite(id)

            sbm = list(db.sprite_by_material(id))
            if len(sbm):
                for (base, mat, sprite, effect) in sbm:
                    if not empty(base):
                        uses[base].append(f"{id} for material {mat}")
                continue

            sbmt = list(db.sprite_by_material_type(id))
            if len(sbmt):
                for (base, mat, sprite) in sbmt:
                    if not empty(base):
                        uses[base].append(f"{id} for material {mat} (via type)")
                continue

            sc = list(db.sprite_combine(id))
            if len(sc):
                for (base, off, sprite, tint) in sc:
                    if not empty(base):
                        uses[base].append(f"{id} as combined part")
                continue

            sf = list(db.sprite_frames(id))
            if len(sf):
                for (base,) in sf:
                    if not empty(sf):
                        uses[base].append(f"{id} as animation frame")
                continue

            sr = list(db.sprite_random(id))
            if len(sr):
                for (base, sprite) in sr:
                    if not empty(base):
                        uses[base].append(f"{id} as random variation")
                continue

            sro = list(db.sprite_rotations(id))
            if len(sro):
                for (base, sprite, rot, effect) in sro:
                    if not empty(base):
                        try:
                            uses[base].append(f"{id} as rotation {rot} {effect}")
                        except KeyError:
                            print(f"Invalid base: {base} in sprite rotation {id}")
                continue

            ss = list(db.sprite_seasons(id))
            if len(ss):
                for (base, season) in ss:
                    if not empty(base):
                        uses[base].append(f"{id} for season {season}")
                    else:
                        ssr = list(db.sprite_seasons_rotations(id, season))
                        for (base, rot) in ssr:
                            uses[base].append(f"{id} for season {season}, rotation {rot}")
                continue

            if not empty(base):
                try:
                    uses[base].append(f"{id}")
                except KeyError:
                    print(f"Invalid base: {base} in sprite {id}")
            elif id in uses:
                uses[id].append(f"{id}")

        tilesheets = sorted(
            [
                {
                    "filename": tilesheet,
                    "basesprites": [
                        {"index": basesprites.index(bs), **bs} for bs in basesprites if bs["tilesheet"] == tilesheet
                    ],
                }
                for tilesheet in set([b["tilesheet"] for b in basesprites])
            ],
            key=lambda ts: ts["filename"],
        )

        with open(os.path.join(output, "index.html"), mode="w") as f:
            f.write(self.env.get_template("index.html.j2").render(tilesheets=tilesheets, uses=uses))

        for asset in self.assets:
            shutil.copy(os.path.join(ASSET_PATH, asset), os.path.join(output, "assets", asset))
        for asset in map(lambda ts: ts["filename"], tilesheets):
            shutil.copy(os.path.join(CONTENT_PATH, "tilesheet", asset), os.path.join(output, "assets", asset))

    # def sprite(self, id):
    #     # Keep last row only
    #     row = None
    #     for r in self.conn.execute("SELECT offset, basesprite, tint FROM Sprites WHERE id = ?", (id,)):
    #         row = r
    #     return row

    # def sprite_by_material(self, id):
    #     return self.conn.execute(
    #         "SELECT basesprite, materialid, sprite, effect FROM Sprites_ByMaterials WHERE id = ?",
    #         (id,),
    #     )

    # def sprite_by_material_type(self, id):
    #     return self.conn.execute(
    #         """SELECT bmt.basesprite, m.id, bmt.sprite
    #            FROM Sprites_ByMaterialTypes bmt
    #            JOIN Materials m ON m.type = bmt.materialtype
    #            WHERE bmt.id = ?""",
    #         (id,),
    #     )

    # def sprite_combine(self, id):
    #     return self.conn.execute(
    #         "SELECT basesprite, offset, sprite, tint FROM Sprites_Combine WHERE id = ?",
    #         (id,),
    #     )

    # def sprite_frames(self, id):
    #     return self.conn.execute("SELECT DISTINCT basesprite FROM Sprites_Frames WHERE id = ?", (id,))

    # def sprite_random(self, id):
    #     return self.conn.execute("SELECT basesprite, sprite FROM Sprites_Random WHERE id = ?", (id,))

    # def sprite_rotations(self, id):
    #     return self.conn.execute(
    #         "SELECT basesprite, sprite, rotation, effect FROM Sprites_Rotations WHERE id = ?", (id,)
    #     )

    # def sprite_seasons(self, id):
    #     return self.conn.execute("SELECT basesprite, season FROM Sprites_Seasons WHERE id = ?", (id,))

    # def sprite_seasons_rotations(self, id, season):
    #     return self.conn.execute(
    #         "SELECT basesprite, rotation FROM Sprites_Seasons_Rotations WHERE id = ?", (f"{id}{season}",)
    #     )

    # def sprites(self):
    #     return [id for (id,) in self.conn.execute("SELECT id FROM Sprites")]
