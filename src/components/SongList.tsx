import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { sampleSongs } from '../data/songs';
import { useProgress } from '../contexts/ProgressContext';
import { SkillLevel, Song } from '../types';
import { fetchSongs } from '../services/songApi';

const filters: Array<'all' | SkillLevel> = ['all', 'beginner', 'intermediate', 'advanced'];
const PAGE_SIZE = 12;
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function transposeChord(chord: string, semitones: number) {
  const match = chord.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match) return chord;
  const note = match[1].replace('b', '#');
  const index = noteNames.indexOf(note);
  if (index === -1) return chord;
  return `${noteNames[(index + semitones + 120) % 12]}${match[2]}`;
}

function transposeKey(key: string, semitones: number) {
  const match = key.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match) return key;
  return `${transposeChord(match[1], semitones)}${match[2]}`;
}

export default function SongList() {
  const { progress, markSongPracticed } = useProgress();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<'all' | SkillLevel>('all');
  const [genre, setGenre] = useState('');
  const [chord, setChord] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [tempo, setTempo] = useState(120);
  const [transpose, setTranspose] = useState(0);
  const [catalogSongs, setCatalogSongs] = useState<Song[] | null>(null);
  const [catalogHasMore, setCatalogHasMore] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(Boolean(process.env.EXPO_PUBLIC_SONG_API_URL));

  useEffect(() => {
    if (!process.env.EXPO_PUBLIC_SONG_API_URL) return;
    const controller = new AbortController();
    setCatalogLoading(true);
    setCatalogPage(1);
    fetchSongs({ query, difficulty: level, genre, chord, page: 1, pageSize: PAGE_SIZE, signal: controller.signal })
      .then((page) => {
        if (page) {
          setCatalogSongs(page.songs);
          setCatalogHasMore(page.hasMore);
        }
        setCatalogError(null);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setCatalogError('The online catalog is unavailable. Showing the downloaded catalog.');
      })
      .finally(() => setCatalogLoading(false));
    return () => controller.abort();
  }, [chord, genre, level, query]);

  const loadMoreSongs = () => {
    if (!process.env.EXPO_PUBLIC_SONG_API_URL || catalogLoading || !catalogHasMore) return;
    const nextPage = catalogPage + 1;
    setCatalogLoading(true);
    fetchSongs({ query, difficulty: level, genre, chord, page: nextPage, pageSize: PAGE_SIZE })
      .then((page) => {
        if (page) {
          setCatalogSongs((current) => [...(current ?? []), ...page.songs]);
          setCatalogPage(nextPage);
          setCatalogHasMore(page.hasMore);
        }
      })
      .catch(() => setCatalogError('More songs could not be loaded. Please try again.'))
      .finally(() => setCatalogLoading(false));
  };

  const songs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sourceSongs = catalogSongs ?? sampleSongs;
    return sourceSongs.filter((song) => {
      const matchesLevel = level === 'all' || song.difficulty === level;
      const matchesGenre = !genre || song.genre.toLowerCase() === genre.toLowerCase();
      const matchesChord = !chord || song.chordIds.includes(chord);
      const matchesQuery = !normalizedQuery
        || `${song.title} ${song.artist} ${song.genre} ${song.chordIds.join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesLevel && matchesGenre && matchesChord && matchesQuery;
    });
  }, [catalogSongs, chord, genre, level, query]);

  const openSong = (song: Song) => {
    setSelectedSong(song);
    setTempo(song.tempo);
    setTranspose(0);
  };
  const displayedChart = selectedSong
    ? selectedSong.chart.split(' ').map((chord) => transposeChord(chord, transpose)).join(' ')
    : '';
  const displayedKey = selectedSong ? transposeKey(selectedSong.key, transpose) : '';

  const renderSong = ({ item }: { item: Song }) => {
    const practiced = progress.practicedSongs.includes(item.id);
    return (
      <Pressable style={styles.songItem} onPress={() => openSong(item)}>
        <View style={styles.songHeader}>
          <View style={styles.songHeading}>
            <Text style={styles.songTitle}>{item.title}</Text>
            <Text style={styles.songArtist}>{item.artist}</Text>
          </View>
          <Text style={styles.openIcon}>{practiced ? '✓' : '›'}</Text>
        </View>
        <View style={styles.songMeta}>
          <Text style={styles.songMetaText}>{item.key}  ·  {item.tempo} BPM</Text>
          <Text style={styles.levelBadge}>{item.difficulty}</Text>
        </View>
        <Text style={styles.songChords}>{item.sections ? 'CHORDS + LYRICS' : item.chordIds.map((chord) => chord.toUpperCase()).join('  ·  ')}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search songs, artists, or chords"
        placeholderTextColor="#718092"
        style={styles.searchInput}
        accessibilityLabel="Search songs"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => (
          <Pressable key={item} onPress={() => setLevel(item)} style={[styles.filter, level === item && styles.filterActive]}>
            <Text style={[styles.filterText, level === item && styles.filterTextActive]}>{item === 'all' ? 'All songs' : item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {['', 'Traditional', 'Folk', 'Acoustic', 'Blues', 'Children', 'Rock'].map((item) => (
          <Pressable key={item || 'all-genres'} onPress={() => setGenre(item)} style={[styles.filter, genre === item && styles.filterActive]}>
            <Text style={[styles.filterText, genre === item && styles.filterTextActive]}>{item || 'All genres'}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.resultText}>{songs.length} {songs.length === 1 ? 'song' : 'songs'} available</Text>
      {catalogLoading && <Text style={styles.statusText}>Loading the online catalog…</Text>}
      {catalogError && <Text style={styles.errorText}>{catalogError}</Text>}
      <FlatList
        data={songs}
        renderItem={renderSong}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMoreSongs}
        onEndReachedThreshold={0.6}
        ListFooterComponent={catalogHasMore ? <Text style={styles.statusText}>Scroll for more songs…</Text> : null}
        ListEmptyComponent={<Text style={styles.emptyText}>No songs match that search yet.</Text>}
      />

      <Modal visible={selectedSong !== null} animationType="slide" onRequestClose={() => setSelectedSong(null)}>
        {selectedSong && (
          <View style={styles.modal}>
            <ScrollView contentContainerStyle={styles.detailContent}>
              <Pressable onPress={() => setSelectedSong(null)} style={styles.closeButton}>
                <Text style={styles.closeText}>‹  Song library</Text>
              </Pressable>
              <Text style={styles.detailKicker}>{selectedSong.genre.toUpperCase()}  ·  {selectedSong.difficulty.toUpperCase()}</Text>
              <Text style={styles.detailTitle}>{selectedSong.title}</Text>
              <Text style={styles.detailArtist}>{selectedSong.artist}</Text>

              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.sectionTitle}>Chord chart</Text>
                  <Text style={styles.keyText}>Key: {displayedKey}</Text>
                </View>
                {selectedSong.sections ? (
                  <View style={styles.lyricsChart}>
                    {selectedSong.sections.map((section) => (
                      <View key={section.title} style={styles.songSection}>
                        <Text style={styles.sectionLabel}>{section.title.toUpperCase()}</Text>
                        {section.lines.map((line, index) => (
                          <View key={`${section.title}-${index}`} style={styles.lyricLine}>
                            <Text style={styles.lineChords}>{line.chords.split(' ').map((chord) => transposeChord(chord, transpose)).join(' ')}</Text>
                            <Text style={styles.lineLyrics}>{line.lyrics}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.chartText}>{displayedChart}</Text>
                )}
                <Text style={styles.chartHint}>Play each chord in order and keep your strumming steady.</Text>
              </View>

              <View style={styles.controlCard}>
                <View style={styles.controlHeader}>
                  <Text style={styles.sectionTitle}>Practice tempo</Text>
                  <Text style={styles.controlValue}>{tempo} BPM</Text>
                </View>
                <View style={styles.controlRow}>
                  <Pressable style={styles.smallButton} onPress={() => setTempo((value) => Math.max(40, value - 5))}><Text style={styles.smallButtonText}>−5</Text></Pressable>
                  <View style={styles.tempoTrack}><View style={[styles.tempoFill, { width: `${Math.min(100, Math.max(0, (tempo - 40) / 2))}%` }]} /></View>
                  <Pressable style={styles.smallButton} onPress={() => setTempo((value) => Math.min(240, value + 5))}><Text style={styles.smallButtonText}>+5</Text></Pressable>
                </View>
                <Text style={styles.controlHint}>Start slowly, then increase the tempo when the changes feel comfortable.</Text>
              </View>

              <View style={styles.controlCard}>
                <View style={styles.controlHeader}>
                  <Text style={styles.sectionTitle}>Transpose</Text>
                  <Text style={styles.controlValue}>{transpose === 0 ? 'Original key' : `${transpose > 0 ? '+' : ''}${transpose} semitone${Math.abs(transpose) === 1 ? '' : 's'}`}</Text>
                </View>
                <View style={styles.transposeRow}>
                  <Pressable style={styles.transposeButton} onPress={() => setTranspose((value) => value - 1)}><Text style={styles.smallButtonText}>−</Text></Pressable>
                  <Text style={styles.transposeValue}>{displayedKey}</Text>
                  <Pressable style={styles.transposeButton} onPress={() => setTranspose((value) => value + 1)}><Text style={styles.smallButtonText}>+</Text></Pressable>
                </View>
              </View>

              <View style={styles.noteCard}>
                <Text style={styles.noteLabel}>ABOUT THIS CHART</Text>
                <Text style={styles.noteText}>{selectedSong.licenseInfo}. This chart is for practice and does not include a recording.</Text>
              </View>
              <Pressable style={styles.practiceButton} onPress={() => markSongPracticed(selectedSong.id)}>
                <Text style={styles.practiceButtonText}>{progress.practicedSongs.includes(selectedSong.id) ? 'Practice recorded ✓' : 'Mark as practised'}</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchInput: { backgroundColor: '#17202b', borderRadius: 13, borderWidth: 1, borderColor: '#263544', color: '#fff', fontSize: 15, paddingHorizontal: 15, paddingVertical: 13 },
  filters: { gap: 8, paddingVertical: 14 },
  filter: { borderRadius: 18, borderWidth: 1, borderColor: '#304152', paddingHorizontal: 14, paddingVertical: 8 },
  filterActive: { backgroundColor: '#31c778', borderColor: '#31c778' },
  filterText: { color: '#9eafbf', fontSize: 13, fontWeight: '700' },
  filterTextActive: { color: '#07130d' },
  resultText: { color: '#718092', fontSize: 12, marginBottom: 10 },
  statusText: { color: '#31c778', fontSize: 12, marginBottom: 10 },
  errorText: { color: '#f5c76b', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  listContent: { paddingBottom: 24 },
  songItem: { backgroundColor: '#17202b', borderRadius: 16, borderWidth: 1, borderColor: '#263544', padding: 16, marginBottom: 12 },
  songHeader: { flexDirection: 'row', alignItems: 'center' },
  songHeading: { flex: 1 },
  songTitle: { color: '#f7fafc', fontSize: 18, fontWeight: '800' },
  songArtist: { color: '#9eafbf', fontSize: 14, marginTop: 3 },
  openIcon: { color: '#31c778', fontSize: 27, marginLeft: 8 },
  songMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 },
  songMetaText: { color: '#d6e1ea', fontSize: 12, fontWeight: '700' },
  levelBadge: { color: '#31c778', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  songChords: { color: '#8bd9ae', fontSize: 12, marginTop: 12, fontWeight: '700' },
  emptyText: { color: '#9eafbf', textAlign: 'center', padding: 25 },
  modal: { flex: 1, backgroundColor: '#0e151d' },
  detailContent: { padding: 22, paddingBottom: 42 },
  closeButton: { marginBottom: 28 },
  closeText: { color: '#31c778', fontSize: 15, fontWeight: '700' },
  detailKicker: { color: '#31c778', fontSize: 12, letterSpacing: 1.3, fontWeight: '800' },
  detailTitle: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 8 },
  detailArtist: { color: '#aebdca', fontSize: 17, marginTop: 4, marginBottom: 26 },
  chartCard: { backgroundColor: '#17202b', borderRadius: 16, padding: 17, marginBottom: 14 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  keyText: { color: '#31c778', fontWeight: '800', fontSize: 12 },
  chartText: { color: '#f5c76b', fontSize: 22, fontWeight: '900', letterSpacing: 1, marginTop: 22 },
  lyricsChart: { marginTop: 18 },
  songSection: { marginBottom: 20 },
  sectionLabel: { color: '#9eafbf', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
  lyricLine: { marginBottom: 14 },
  lineChords: { color: '#aeb7ff', fontSize: 14, fontWeight: '800', minHeight: 20 },
  lineLyrics: { color: '#f1f5f9', fontFamily: 'serif', fontSize: 16, lineHeight: 24 },
  chartHint: { color: '#9eafbf', fontSize: 13, lineHeight: 19, marginTop: 15 },
  controlCard: { backgroundColor: '#17202b', borderRadius: 16, padding: 17, marginBottom: 14 },
  controlHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  controlValue: { color: '#31c778', fontSize: 13, fontWeight: '800' },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 17 },
  smallButton: { width: 42, height: 36, borderRadius: 10, backgroundColor: '#273746', alignItems: 'center', justifyContent: 'center' },
  smallButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  tempoTrack: { flex: 1, height: 7, backgroundColor: '#2c3c4d', borderRadius: 4, overflow: 'hidden' },
  tempoFill: { height: '100%', backgroundColor: '#31c778', borderRadius: 4 },
  controlHint: { color: '#8494a6', fontSize: 12, lineHeight: 18, marginTop: 12 },
  transposeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15 },
  transposeButton: { width: 42, height: 36, borderRadius: 10, backgroundColor: '#273746', alignItems: 'center', justifyContent: 'center' },
  transposeValue: { color: '#fff', fontSize: 16, fontWeight: '800' },
  noteCard: { borderRadius: 14, backgroundColor: '#1e2d25', padding: 15, marginBottom: 18 },
  noteLabel: { color: '#31c778', fontWeight: '800', fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  noteText: { color: '#c5d9ce', fontSize: 13, lineHeight: 19 },
  practiceButton: { backgroundColor: '#31c778', borderRadius: 14, padding: 17, alignItems: 'center' },
  practiceButtonText: { color: '#07130d', fontSize: 16, fontWeight: '900' },
});
