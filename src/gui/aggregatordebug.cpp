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
#include "aggregatordebug.h"

#include "../base/util.h"
#include "../game/game.h"
#include "../gfx/spritefactory.h"

#include <QDebug>

AggregatorDebug::AggregatorDebug( QObject* parent ) :
	QObject(parent)
{

}

AggregatorDebug::~AggregatorDebug()
{
}

void AggregatorDebug::init( Game* game )
{
  g = game;
}

void AggregatorDebug::update()
{
  onRequestTilesheets();
}

void AggregatorDebug::onSpawnCreature( QString type )
{
	qDebug() << "spawn creature:" << type;
	if( type == "Gnome" )
	{
		emit signalTriggerEvent( EventType::MIGRATION, QVariantMap() );
	}
	else if( type == "Trader" )
	{
		emit signalTriggerEvent( EventType::TRADER, QVariantMap() );
	}
	else if( type == "Goblin" )
	{
		QVariantMap args;
		args.insert( "Amount", 1 );
		args.insert( "Type", "Goblin" );
		emit signalTriggerEvent( EventType::INVASION, args );
	}
}


void AggregatorDebug::onSetWindowSize( int width, int height )
{
	emit signalSetWindowSize( width, height );
}

void AggregatorDebug::onRequestTilesheets()
{
    if( !g ) return;

    QStringList tsns;

    for ( const auto& ts : g->sf()->pixmaps() )
    {
        tsns.append(ts);
    }

    tsns.sort();

    m_tilesheets.clear();

    for ( const auto& ts : tsns )
    {
        QPixmap pm = g->sf()->pixmap( ts );

        std::vector<unsigned char> buffer;
        Global::util->createBufferForNoesisImage( pm, buffer, true );

        GuiTilesheet gts { ts, pm.width(), pm.height(), buffer };
        m_tilesheets.append( gts );
    }

    emit signalDebugTilesheets( m_tilesheets );
}
