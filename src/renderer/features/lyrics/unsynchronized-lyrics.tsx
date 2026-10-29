import clsx from 'clsx';
import { useEffect, useMemo, useRef } from 'react';

import styles from './unsynchronized-lyrics.module.css';

import { LyricsScrollContent } from '/@/renderer/features/lyrics/components/lyrics-scroll-content';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import { useLyricsDisplaySettings, useLyricsSettings, usePlayerStoreBase } from '/@/renderer/store';
import { subscribePlayerProgress, useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { FullLyricsMetadata } from '/@/shared/types/domain-types';

export interface UnsynchronizedLyricsProps extends Omit<FullLyricsMetadata, 'lyrics'> {
    lyrics: string;
    preview?: boolean;
    romajiLyrics?: null | string;
    settingsKey?: string;
    translatedLyrics?: null | string;
}

const PREVIEW_FONT_SIZE = 20;
const PREVIEW_GAP = 20;

export const UnsynchronizedLyrics = ({
    artist,
    lyrics,
    name,
    preview = false,
    romajiLyrics,
    settingsKey = 'default',
    source,
    translatedLyrics,
}: UnsynchronizedLyricsProps) => {
    const lyricsSettings = useLyricsSettings();
    const displaySettings = useLyricsDisplaySettings(settingsKey);
    const settings = {
        ...lyricsSettings,
        fontSizeUnsync: preview
            ? PREVIEW_FONT_SIZE
            : displaySettings.fontSizeUnsync && displaySettings.fontSizeUnsync !== 0
              ? displaySettings.fontSizeUnsync
              : 24,
        gapUnsync: preview
            ? PREVIEW_GAP
            : displaySettings.gapUnsync && displaySettings.gapUnsync !== 0
              ? displaySettings.gapUnsync
              : 24,
    };
    const lines = useMemo(() => {
        return lyrics.split('\n');
    }, [lyrics]);

    const translatedLines = useMemo(() => {
        return translatedLyrics ? translatedLyrics.split('\n') : [];
    }, [translatedLyrics]);

    const romajiLines = useMemo(() => {
        return romajiLyrics ? romajiLyrics.split('\n') : [];
    }, [romajiLyrics]);

    const containerRef = useRef<HTMLDivElement>(null);
    const manualScrollUntilRef = useRef(0);
    const pauseAutoScroll = () => {
	manualScrollUntilRef.current = Date.now() + 5000;
    };

    useEffect(() => {
	if (preview) return undefined;

	const scrollToProgress = (timestampSec: number) => {
	    const el = containerRef.current;
	    if (!el || Date.now() < manualScrollUntilRef.current) return;

	    const durationMs = usePlayerStoreBase.getState().getCurrentSong()?.duration;
	    if (!durationMs) return;

	    const ratio = Math.min(1, Math.max(0, (timestampSec * 1000) / durationMs));
	    el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
	};

	scrollToProgress(useTimestampStoreBase.getState().timestamp);

	return subscribePlayerProgress(({ timestamp }) => scrollToProgress(timestamp));
    }, [preview, lines]);

    return (
        <div
	    className={clsx(styles.container, preview && styles.preview)}
	    onTouchMove={pauseAutoScroll}
	    onWheel={pauseAutoScroll}
	    ref={containerRef}
	>
            <LyricsScrollContent
                bottomScrollPadding="6vh"
                gap={settings.gapUnsync}
                paddingLeft={preview ? 0 : (displaySettings.paddingLeft ?? 0)}
                paddingRight={preview ? 0 : (displaySettings.paddingRight ?? 0)}
                preview={preview}
            >
                {settings.showProvider && source && (
                    <LyricLine
                        alignment={settings.alignment}
                        fontSize={settings.fontSizeUnsync}
                        text={`${source}`}
                    />
                )}
                {settings.showMatch && (
                    <LyricLine
                        alignment={settings.alignment}
                        fontSize={settings.fontSizeUnsync}
                        text={`${name} — ${artist}`}
                    />
                )}
                {lines.map((text, idx) => (
                    <LyricLine
                        alignment={settings.alignment}
                        className="lyric-line unsynchronized"
                        fontSize={settings.fontSizeUnsync}
                        id={`lyric-${idx}`}
                        key={idx}
                        romajiText={romajiLines[idx]}
                        text={text}
                        translatedText={translatedLines[idx]}
                    />
                ))}
            </LyricsScrollContent>
        </div>
    );
};
