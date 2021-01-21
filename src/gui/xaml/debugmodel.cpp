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
#include "debugmodel.h"
#include "debugproxy.h"

#include "../../base/db.h"

#include <NsApp/Application.h>
#include <NsCore/Log.h>
#include <NsCore/ReflectionImplement.h>
#include <NsCore/ReflectionImplementEnum.h>
#include <NsGui/ObservableCollection.h>
#include <NsGui/UIElement.h>

#include <QDebug>

using namespace IngnomiaGUI;
using namespace Noesis;
using namespace NoesisApp;


////////////////////////////////////////////////////////////////////////////////////////////////////
WSEntry::WSEntry( int width, int height ) :
	m_width( width ),
	m_height( height )
{
	m_name = ( QString::number( width ) + "x" + QString::number( height ) ).toStdString().c_str();
}

const char* WSEntry::getName() const
{
  return m_name.Str();
}

////////////////////////////////////////////////////////////////////////////////////////////////////
TilesheetEntry::TilesheetEntry( const GuiTilesheet& gts )
{
  m_name = gts.name.toStdString().c_str();
  m_width = gts.width;
  m_height = gts.height;
  m_pic = BitmapImage::Create( gts.width, gts.height, 96, 96, gts.pic.data(), 4 * gts.width, BitmapSource::Format::Format_RGBA8 );
  m_basesprites = *new ObservableCollection<BasespriteEntry>();

  for ( auto row : DB::selectRows( "BaseSprites", "Tilesheet", gts.name ) )
  {
    m_basesprites->Add( MakePtr<BasespriteEntry>( row ) );
  }
}

const char* TilesheetEntry::getName() const
{
  return m_name.Str();
}

////////////////////////////////////////////////////////////////////////////////////////////////////
BasespriteEntry::BasespriteEntry( const QVariantMap& row )
{
  m_id = row.value( "ID" ).toString().toStdString().c_str();
  QString rect = row.value( "SourceRectangle" ).toString();

  QStringList rl = rect.split( " " );
  if ( rl.size() == 4 )
  {
    m_x    = rl[0].toInt();
    m_y    = rl[1].toInt();
    m_dimX = rl[2].toInt();
    m_dimY = rl[3].toInt();
  }
}

const char* BasespriteEntry::getName() const
{
  return m_id.Str();
}

////////////////////////////////////////////////////////////////////////////////////////////////////
DebugModel::DebugModel()
{
	m_proxy = new DebugProxy;
	m_proxy->setParent( this );

	m_pageCmd.SetExecuteFunc( MakeDelegate( this, &DebugModel::onPageCmd ) );
	m_spawnCmd.SetExecuteFunc( MakeDelegate( this, &DebugModel::onSpawnCmd ) );

	m_windowSizes = *new ObservableCollection<WSEntry>();
	m_windowSizes->Add( MakePtr<WSEntry>( 1920, 1080 ) );
	m_windowSizes->Add( MakePtr<WSEntry>( 1360, 768 ) );

  m_tilesheets = *new ObservableCollection<TilesheetEntry>();
}

const char* DebugModel::GetShowFirst() const
{
	if ( m_page == DebugPage::First )
	{
		return "Visible";
	}
	return "Hidden";
}

const char* DebugModel::GetShowSecond() const
{
	if ( m_page == DebugPage::Second )
	{
		return "Visible";
	}
	return "Hidden";
}

const char* DebugModel::GetShowThird() const
{
  if ( m_page == DebugPage::Third )
  {
    return "Visible";
  }
  return "Hidden";
}

const char* DebugModel::GetShowSprites() const
{
  if ( m_page == DebugPage::Sprites )
  {
    return "Visible";
  }
  return "Hidden";
}

void DebugModel::onPageCmd( BaseComponent* param )
{
	if( param->ToString() == "First" )
	{
		m_page = DebugPage::First;
	}
	else if( param->ToString() == "Second" )
	{
		m_page = DebugPage::Second;
	}
	else if( param->ToString() == "Third" )
	{
		m_page = DebugPage::Third;
	}
  else
  {
    m_page = DebugPage::Sprites;
  }

	OnPropertyChanged( "ShowFirst" );
	OnPropertyChanged( "ShowSecond" );
  OnPropertyChanged( "ShowThird" );
  OnPropertyChanged( "ShowSprites" );
}

void DebugModel::onSpawnCmd( BaseComponent* param )
{
	m_proxy->spawnCreature( param->ToString().Str() );
}

Noesis::ObservableCollection<WSEntry>* DebugModel::getWindowSizes() const
{
    return m_windowSizes;
}

void DebugModel::setWindowSize( WSEntry* item )
{
    if( item && m_selectedWindowSize != item )
	{
        m_selectedWindowSize = item;
        m_proxy->setWindowSize( item->m_width, item->m_height );
	}
}

WSEntry* DebugModel::getWindowSize() const
{
    return m_selectedWindowSize;
}

void DebugModel::updateTilesheets( const QList<GuiTilesheet>& tilesheets )
{
    m_tilesheets->Clear();
    for ( const auto& gts : tilesheets )
    {
        m_tilesheets->Add( MakePtr<TilesheetEntry>( gts ) );
    }

    OnPropertyChanged( "Tilesheets" );

    if ( m_selectedTilesheet == nullptr ) {
        setTilesheet(m_tilesheets->Get(0));
    }
}

Noesis::ObservableCollection<TilesheetEntry>* DebugModel::getTilesheets() const
{
    return m_tilesheets;
}

void DebugModel::setTilesheet( TilesheetEntry* item )
{
    if( item && m_selectedTilesheet != item )
    {
        m_selectedTilesheet = item;
        OnPropertyChanged( "SelectedTilesheet" );
    }
}

TilesheetEntry* DebugModel::getTilesheet() const
{
    return m_selectedTilesheet;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
NS_BEGIN_COLD_REGION

NS_IMPLEMENT_REFLECTION( DebugModel, "IngnomiaGUI.DebugModel" )
{
	NsProp( "PageCmd", &DebugModel::GetPageCmd );
	NsProp( "ShowFirst", &DebugModel::GetShowFirst );
	NsProp( "ShowSecond", &DebugModel::GetShowSecond );
  NsProp( "ShowThird", &DebugModel::GetShowThird );
  NsProp( "ShowSprites", &DebugModel::GetShowSprites );

	NsProp( "SpawnCmd", &DebugModel::GetSpawnCmd );

  NsProp( "WindowSizes", &DebugModel::getWindowSizes );
  NsProp( "SelectedWindowSize", &DebugModel::getWindowSize, &DebugModel::setWindowSize );

  NsProp( "Tilesheets", &DebugModel::getTilesheets );
  NsProp( "SelectedTilesheet", &DebugModel::getTilesheet, &DebugModel::setTilesheet );
}

NS_IMPLEMENT_REFLECTION( WSEntry )
{
  NsProp( "Name", &WSEntry::getName );
}

NS_IMPLEMENT_REFLECTION( TilesheetEntry )
{
  NsProp( "Name", &TilesheetEntry::getName );
  NsProp( "Width", &TilesheetEntry::m_width );
  NsProp( "Height", &TilesheetEntry::m_height );
  NsProp( "BitmapSource", &TilesheetEntry::m_pic );
  NsProp( "BaseSprites", &TilesheetEntry::m_basesprites );
}

NS_IMPLEMENT_REFLECTION( BasespriteEntry )
{
  NsProp( "Name", &BasespriteEntry::getName );
  NsProp( "X", &BasespriteEntry::m_x );
  NsProp( "Y", &BasespriteEntry::m_y );
  NsProp( "DimX", &BasespriteEntry::m_dimX );
  NsProp( "DimY", &BasespriteEntry::m_dimY );
}
