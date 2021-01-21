/*
	This file is part of Ingnomia https://github.com/rschurade/Ingnomia
    Copyright (C) 2017-2020  Ralph Schurade, Ingnomia Team

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
#pragma once

#include "../game/creature.h"
#include "../game/eventmanager.h"

#include <QObject>
#include <QPixmap>

class Game;

struct GuiTilesheet
{
    QString name = "";
    int width;
    int height;
    std::vector<unsigned char> pic;
};
Q_DECLARE_METATYPE( GuiTilesheet )

class AggregatorDebug : public QObject
{
	Q_OBJECT

public:
	AggregatorDebug( QObject* parent = nullptr );
	~AggregatorDebug();

    void init( Game* game );
    void update();

private:
    QPointer<Game> g;
    QList<GuiTilesheet> m_tilesheets;

public slots:
	void onSpawnCreature( QString type );
    void onSetWindowSize( int width, int height );
    void onRequestTilesheets();

signals:
	void signalTriggerEvent( EventType type, QVariantMap args );
    void signalSetWindowSize( int width, int height );
    void signalDebugTilesheets( const QList<GuiTilesheet>& tilesheets );
};
