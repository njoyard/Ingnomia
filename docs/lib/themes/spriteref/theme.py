import os
import shutil
from jinja2 import Environment, FileSystemLoader

from ...db import db
from ...util import DOCDIR, sprite_rect

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

        tilesheets = sorted(
            [
                {"filename": tilesheet, "basesprites": [bs for bs in basesprites if bs["tilesheet"] == tilesheet]}
                for tilesheet in set([b["tilesheet"] for b in basesprites])
            ],
            key=lambda ts: ts["filename"],
        )

        with open(os.path.join(output, "index.html"), mode="w") as f:
            f.write(self.env.get_template("index.html.j2").render(tilesheets=tilesheets))

        for asset in self.assets:
            shutil.copy(os.path.join(ASSET_PATH, asset), os.path.join(output, "assets", asset))
        for asset in map(lambda ts: ts["filename"], tilesheets):
            shutil.copy(os.path.join(CONTENT_PATH, "tilesheet", asset), os.path.join(output, "assets", asset))
