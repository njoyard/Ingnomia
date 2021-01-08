from .db import db
from .util import empty, log


class TechTree:
    def _compute(self):
        # Item/workshop level is 0 if available from nature, else max(required items/workshop) + 1
        item_levels = {itemid: 0 for itemid in db.baseitems()}
        workshop_levels = {}

        queue = [*[("craft", id) for id in db.crafts()], *[("workshop", id) for (id, _, _) in db.workshops()]]

        def craftable(craft, workshops):
            components = [itemid for (_, itemid, _, _) in db.craft_components(craft)]
            ws_levels = []

            for workshopid in workshops:
                if workshopid in workshop_levels:
                    ws_levels.append(workshop_levels[workshopid])

            if len(ws_levels) == 0:
                return -1

            for itemid in components:
                if itemid not in item_levels:
                    return -1

            return max([*[item_levels[itemid] for itemid in components], *ws_levels]) + 1

        def buildable(workshopid):
            components = [id for (id, _) in db.workshop_components(workshopid)]
            for itemid in components:
                if itemid not in item_levels:
                    return -1
            return max([item_levels[itemid] for itemid in components]) + 1

        iterations = 0
        while len(queue):
            iterations += 1
            if iterations > 10000:
                log("Too many iterations computing tech tree, aborting", "! ")
                break

            (type, id) = queue.pop(0)
            if type == "craft":
                craft = db.craft(id)

                if craft is None:
                    # Craft for non existing item, ignore
                    continue

                (_, itemid, _, _, _, _, _, _) = craft

                if empty(itemid):
                    # Burn recipe, ignore
                    continue

                workshops = db.workshops_for_craft(id)
                if len(workshops) == 0:
                    # No workshop can do that, ignore
                    continue

                level = craftable(id, workshops)
                if level == -1:
                    queue.append(("craft", id))
                else:
                    if itemid in item_levels:
                        item_levels[itemid] = min(level, item_levels[itemid])
                    else:
                        item_levels[itemid] = level

                    # Special case for beehive: we can now produce honey
                    if itemid == "BeeHive":
                        item_levels["Honey"] = level + 1
            elif type == "workshop":
                level = buildable(id)
                if level == -1:
                    queue.append(("workshop", id))
                else:
                    if id in workshop_levels:
                        workshop_levels[id] = min(level, workshop_levels[id])
                    else:
                        workshop_levels[id] = level

        levels = [
            {
                "craftable": [itemid for itemid in item_levels.keys() if item_levels[itemid] == level],
                "buildable": [id for id in workshop_levels.keys() if workshop_levels[id] == level],
            }
            for level in sorted(set([*item_levels.values(), *workshop_levels.values()]))
        ]

        return levels

    def for_workshop(self, id):
        tt = self._techtree
        level = -1
        for l in tt:
            if id in l["buildable"]:
                level = tt.index(l)

        if level < 1:
            # Unbuildable
            return []

    def for_item(self, id):
        tt = self._techtree
        level = -1
        for l in tt:
            if id in l["craftable"]:
                level = tt.index(l)

        if level < 1:
            # Uncraftable or naturally available
            return []

        # Find the lowest level craft (with lowest max component level and workshop level)
        crafts = [craftid for (craftid, _, _, _, _, _, _) in db.item_crafts(id)]
        lowest_level = 1

    def techtree(self):
        if not hasattr(self, "_techtree"):
            self._techtree = self._compute()
        return self._techtree


techtree = TechTree()
