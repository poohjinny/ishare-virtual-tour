import { useEffect, useState } from 'react';
import { IconTooltip } from '../components/ui/IconTooltip';
import { MaterialSymbol } from '../components/ui/MaterialSymbol';
import {
  TOUR_TOOLBAR_TOGGLE_COLLAPSE_LABEL,
  TOUR_TOOLBAR_TOGGLE_EXPAND_LABEL,
} from '../constants/tourToolbar';
import { cn } from '../lib/cn';
import type { ImmersiveBackgroundController } from '../viewer/immersiveBackgroundController';
import type { ImmersiveBgButtonState } from '../viewer/immersiveBackgroundController';
import { toggleImmersiveBackgroundPlayback } from '../viewer/immersiveBackgroundNavbarButton';
import { tourNavbarMaterialSymbolProps } from '../viewer/tourNavbarMaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_16 } from '../components/ui/materialSymbolClasses';

const NAVBAR_SYMBOL_PROPS = tourNavbarMaterialSymbolProps;

function immersiveTitle(state: ImmersiveBgButtonState): string {
  switch (state) {
    case 'loading':
    case 'muted':
    case 'playing':
      return 'Pause immersive ambience';
    default:
      return 'Play immersive ambience';
  }
}

function ImmersiveBackgroundButton({
  controller,
  disabled,
}: {
  controller: ImmersiveBackgroundController;
  disabled?: boolean;
}) {
  const [state, setState] = useState(() => controller.getButtonState());

  useEffect(
    () => controller.subscribe(() => setState(controller.getButtonState())),
    [controller],
  );

  const enabled = controller.isEnabled() && state !== 'muted';
  const label = immersiveTitle(state);

  return (
    <IconTooltip label={label} placement='top'>
      <button
        type='button'
        className={cn(
          'psv-button psv-immersive-bg-button',
          enabled && 'psv-immersive-bg-button--enabled',
          state === 'loading' && 'psv-immersive-bg-button--loading',
        )}
        disabled={disabled}
        aria-label={label}
        aria-busy={state === 'loading'}
        onClick={() => toggleImmersiveBackgroundPlayback(controller)}
      >
        {state === 'playing' || state === 'loading' ?
          <svg
            className={cn(
              'psv-button-svg psv-immersive-bg-volume',
              state === 'loading' && 'psv-immersive-bg-volume--loading',
            )}
            viewBox='0 0 24 24'
            fill='none'
            aria-hidden
          >
            <rect
              className='psv-immersive-bg-bar psv-immersive-bg-bar--1'
              x='5'
              y='9'
              width='2.75'
              height='6'
              rx='1.375'
              fill='currentColor'
            />
            <rect
              className='psv-immersive-bg-bar psv-immersive-bg-bar--2'
              x='9.125'
              y='6'
              width='2.75'
              height='12'
              rx='1.375'
              fill='currentColor'
            />
            <rect
              className='psv-immersive-bg-bar psv-immersive-bg-bar--3'
              x='13.25'
              y='4'
              width='2.75'
              height='16'
              rx='1.375'
              fill='currentColor'
            />
            <rect
              className='psv-immersive-bg-bar psv-immersive-bg-bar--4'
              x='17.375'
              y='7'
              width='2.75'
              height='10'
              rx='1.375'
              fill='currentColor'
            />
          </svg>
        : <MaterialSymbol name='music_note' {...NAVBAR_SYMBOL_PROPS} />}
      </button>
    </IconTooltip>
  );
}

export interface ThreeDViewerControlsProps {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  toolbarToggleAvailable?: boolean;
  immersiveAvailable?: boolean;
  immersiveController?: ImmersiveBackgroundController | null;
  onRecenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  fullscreenActive?: boolean;
  onFullscreenToggle?: () => void;
  disabled?: boolean;
}

export function ThreeDViewerControls({
  collapsed,
  onToggleCollapsed,
  toolbarToggleAvailable = false,
  immersiveAvailable = false,
  immersiveController,
  onRecenter,
  onZoomIn,
  onZoomOut,
  fullscreenActive = false,
  onFullscreenToggle,
  disabled = false,
}: ThreeDViewerControlsProps) {
  const fullscreen = fullscreenActive;
  const toggleFullscreen = onFullscreenToggle ?? (() => {});

  const toolbarLabel =
    collapsed ?
      TOUR_TOOLBAR_TOGGLE_EXPAND_LABEL
    : TOUR_TOOLBAR_TOGGLE_COLLAPSE_LABEL;

  return (
    <nav
      className='psv-navbar viewer-3d-controls'
      aria-label='3D viewer controls'
      role='toolbar'
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <IconTooltip label='Zoom in' placement='top'>
        <button
          type='button'
          className='psv-button psv-zoom-in-button'
          disabled={disabled}
          aria-label='Zoom in'
          onClick={onZoomIn}
        >
          <MaterialSymbol name='add' {...NAVBAR_SYMBOL_PROPS} />
        </button>
      </IconTooltip>

      <IconTooltip label='Zoom out' placement='top'>
        <button
          type='button'
          className='psv-button psv-zoom-out-button'
          disabled={disabled}
          aria-label='Zoom out'
          onClick={onZoomOut}
        >
          <MaterialSymbol name='remove' {...NAVBAR_SYMBOL_PROPS} />
        </button>
      </IconTooltip>

      <IconTooltip label='Default view' placement='top'>
        <button
          type='button'
          className='psv-button psv-recenter-button'
          disabled={disabled}
          aria-label='Default view'
          onClick={onRecenter}
        >
          <MaterialSymbol name='gps_fixed' {...NAVBAR_SYMBOL_PROPS} />
        </button>
      </IconTooltip>

      {immersiveAvailable && immersiveController ?
        <ImmersiveBackgroundButton
          controller={immersiveController}
          disabled={disabled}
        />
      : null}

      <IconTooltip
        label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        placement='top'
      >
        <button
          type='button'
          className={cn(
            'psv-button psv-fullscreen-button',
            fullscreen && 'psv-fullscreen-button--active',
          )}
          disabled={disabled}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-pressed={fullscreen}
          onClick={toggleFullscreen}
        >
          <MaterialSymbol
            name={fullscreen ? 'fullscreen_exit' : 'fullscreen'}
            {...NAVBAR_SYMBOL_PROPS}
          />
        </button>
      </IconTooltip>

      {toolbarToggleAvailable && onToggleCollapsed ?
        <IconTooltip label={toolbarLabel} placement='top'>
          <button
            type='button'
            className='psv-button psv-tour-toolbar-toggle psv-button--hover-scale'
            disabled={disabled}
            aria-label={toolbarLabel}
            onClick={onToggleCollapsed}
          >
            <span className='psv-toolbar-toggle-icon-stack' aria-hidden>
              <MaterialSymbol
                name={collapsed ? 'unfold_more' : 'unfold_less'}
                className='psv-toolbar-toggle-material-symbol'
                sizePx={MATERIAL_SYMBOL_SIZE_16}
              />
            </span>
          </button>
        </IconTooltip>
      : null}
    </nav>
  );
}
