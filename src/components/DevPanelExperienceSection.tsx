import { IMMERSIVE_PLAYLIST_MANIFEST } from '../constants/immersiveBackground';
import { DevPanelFormRow, DevPanelFormSection } from './DevPanelFormGroup';
import {
  devViewPanelFieldClassName,
  devViewPanelFieldLabelClassName,
  devViewPanelInputClassName,
  devViewPanelSectionHintClassName,
  devViewPanelSelectClassName,
} from './devViewPanelVariants';

export type DevImmersiveMode = 'platform' | 'manifest' | 'audio' | 'playlist';

export interface DevExperienceFormValues {
  transitionEffect: 'fade' | 'black';
  transitionSpeed: string;
  immersiveMode: DevImmersiveMode;
  immersiveAudio: string;
  immersivePlaylistText: string;
  immersivePlaylistManifest: string;
  immersiveVolume: string;
}

export const DEFAULT_DEV_EXPERIENCE_FORM: DevExperienceFormValues = {
  transitionEffect: 'fade',
  transitionSpeed: '500ms',
  immersiveMode: 'platform',
  immersiveAudio: '',
  immersivePlaylistText: '',
  immersivePlaylistManifest: '',
  immersiveVolume: '',
};

export function buildDevExperienceApiFields(values: DevExperienceFormValues) {
  const {
    transitionEffect,
    transitionSpeed,
    immersiveMode,
    immersiveAudio,
    immersivePlaylistText,
    immersivePlaylistManifest,
    immersiveVolume,
  } = values;

  return {
    transitionEffect,
    transitionSpeed: transitionSpeed.trim() || undefined,
    clearImmersiveBackground: immersiveMode === 'platform',
    immersiveAudio: immersiveMode === 'audio' ? immersiveAudio : undefined,
    immersivePlaylist:
      immersiveMode === 'playlist' ? immersivePlaylistText : undefined,
    immersivePlaylistManifest:
      immersiveMode === 'manifest' ? immersivePlaylistManifest : undefined,
    immersiveVolume:
      immersiveMode !== 'platform' && immersiveVolume.trim() ?
        Number(immersiveVolume)
      : undefined,
  };
}

type DevPanelExperienceSectionProps = DevExperienceFormValues & {
  divided?: boolean;
  onTransitionEffectChange: (value: 'fade' | 'black') => void;
  onTransitionSpeedChange: (value: string) => void;
  onImmersiveModeChange: (value: DevImmersiveMode) => void;
  onImmersiveAudioChange: (value: string) => void;
  onImmersivePlaylistTextChange: (value: string) => void;
  onImmersivePlaylistManifestChange: (value: string) => void;
  onImmersiveVolumeChange: (value: string) => void;
};

export function DevPanelExperienceSection({
  divided = false,
  transitionEffect,
  onTransitionEffectChange,
  transitionSpeed,
  onTransitionSpeedChange,
  immersiveMode,
  onImmersiveModeChange,
  immersiveAudio,
  onImmersiveAudioChange,
  immersivePlaylistText,
  onImmersivePlaylistTextChange,
  immersivePlaylistManifest,
  onImmersivePlaylistManifestChange,
  immersiveVolume,
  onImmersiveVolumeChange,
}: DevPanelExperienceSectionProps) {
  return (
    <DevPanelFormSection title='Experience' divided={divided}>
      <div className='flex flex-col gap-3'>
        <DevPanelFormRow>
          <label className={devViewPanelFieldClassName}>
            <span className={devViewPanelFieldLabelClassName}>
              Scene transition
            </span>
            <select
              className={devViewPanelSelectClassName}
              value={transitionEffect}
              onChange={(e) =>
                onTransitionEffectChange(e.target.value as 'fade' | 'black')
              }
            >
              <option value='fade'>Fade</option>
              <option value='black'>Black</option>
            </select>
          </label>
          <label className={devViewPanelFieldClassName}>
            <span className={devViewPanelFieldLabelClassName}>
              Transition speed
            </span>
            <input
              className={devViewPanelInputClassName}
              type='text'
              value={transitionSpeed}
              onChange={(e) => onTransitionSpeedChange(e.target.value)}
              placeholder='500ms'
              spellCheck={false}
              autoComplete='off'
            />
          </label>
        </DevPanelFormRow>
        <p className={devViewPanelSectionHintClassName}>
          Applied when navigating between scenes in the panorama viewer.
        </p>

        <label className={devViewPanelFieldClassName}>
          <span className={devViewPanelFieldLabelClassName}>
            Immersive background (BGM)
          </span>
          <select
            className={devViewPanelSelectClassName}
            value={immersiveMode}
            onChange={(e) =>
              onImmersiveModeChange(e.target.value as DevImmersiveMode)
            }
          >
            <option value='platform'>Platform default playlist</option>
            <option value='manifest'>Playlist manifest JSON</option>
            <option value='audio'>Single audio track</option>
            <option value='playlist'>Inline playlist (one URL per line)</option>
          </select>
        </label>

        {immersiveMode === 'platform' ?
          <p className={devViewPanelSectionHintClassName}>
            Uses platform manifest <code>{IMMERSIVE_PLAYLIST_MANIFEST}</code> —
            no <code>immersiveBackground</code> in tour JSON.
          </p>
        : null}

        {immersiveMode === 'manifest' ?
          <label className={devViewPanelFieldClassName}>
            <span className={devViewPanelFieldLabelClassName}>
              Playlist manifest path
            </span>
            <input
              className={devViewPanelInputClassName}
              type='text'
              value={immersivePlaylistManifest}
              onChange={(e) => onImmersivePlaylistManifestChange(e.target.value)}
              placeholder={IMMERSIVE_PLAYLIST_MANIFEST}
              spellCheck={false}
              autoComplete='off'
            />
          </label>
        : null}

        {immersiveMode === 'audio' ?
          <label className={devViewPanelFieldClassName}>
            <span className={devViewPanelFieldLabelClassName}>
              Audio path or URL
            </span>
            <input
              className={devViewPanelInputClassName}
              type='text'
              value={immersiveAudio}
              onChange={(e) => onImmersiveAudioChange(e.target.value)}
              placeholder='/assets/…/ambient.mp3'
              spellCheck={false}
              autoComplete='off'
            />
          </label>
        : null}

        {immersiveMode === 'playlist' ?
          <label className={devViewPanelFieldClassName}>
            <span className={devViewPanelFieldLabelClassName}>
              Playlist tracks
            </span>
            <textarea
              className={devViewPanelInputClassName}
              rows={4}
              value={immersivePlaylistText}
              onChange={(e) => onImmersivePlaylistTextChange(e.target.value)}
              placeholder={'https://…/track-a.mp3\nhttps://…/track-b.mp3'}
              spellCheck={false}
            />
          </label>
        : null}

        {immersiveMode !== 'platform' ?
          <label className={devViewPanelFieldClassName}>
            <span className={devViewPanelFieldLabelClassName}>Volume (0–1)</span>
            <input
              className={devViewPanelInputClassName}
              type='number'
              min='0'
              max='1'
              step='0.01'
              value={immersiveVolume}
              onChange={(e) => onImmersiveVolumeChange(e.target.value)}
              placeholder='0.28'
            />
          </label>
        : null}
      </div>
    </DevPanelFormSection>
  );
}
