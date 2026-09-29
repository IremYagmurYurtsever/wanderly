import { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { TripsScreen } from '../screens/TripsScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { JournalScreen } from '../screens/JournalScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import {
  PlaceDetailScreen,
  type DetailPlace,
} from '../screens/PlaceDetailScreen/PlaceDetailScreen';
import { NoticeModal } from '../components/NoticeModal';
import { TripPlanningScreen } from '../screens/TripPlanningScreen';
import type { SavedTrip } from '../models/trip';
import type { Screen, Notice } from '../types';
import type { Session } from '../auth/useAuthentication';
import { profileRepository } from '../repositories';
import { previousScreen } from './routes';

export function SignedInApp({
  session,
  onLogout,
  busy,
}: {
  session: Session;
  onLogout: () => Promise<boolean>;
  busy: boolean;
}) {
  const [screen, setScreen] = useState<Screen>('home');
  const [name, setName] = useState(session.name);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [detailPlace, setDetailPlace] = useState<DetailPlace | null>(null);
  const [journalPlace, setJournalPlace] = useState<{ id: string; title: string } | null>(null);
  const [journalTripRequest, setJournalTripRequest] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [planningNewTrip, setPlanningNewTrip] = useState(false);
  function go(next: Screen) {
    if (next === 'welcome' || next === 'signin' || next === 'signup' || next === 'forgot-password')
      return;
    if (next !== 'journal') setJournalPlace(null);
    if (next !== 'journal') setJournalTripRequest(null);
    setScreen(next);
  }
  useEffect(() => {
    let active = true;
    profileRepository
      .load()
      .then((profile) => {
        if (active) setName(profile.name);
      })
      .catch(() => {
        if (active)
          setNotice({
            title: 'Profil yüklenemedi',
            body: 'Profil sunucudan alınamadı. Bağlantını kontrol edip yeniden dene.',
          });
      });
    return () => {
      active = false;
    };
  }, [session.name]);
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (detailPlace) {
        setDetailPlace(null);
        return true;
      }
      if (selectedTrip) {
        setSelectedTrip(null);
        return true;
      }
      if (planningNewTrip) {
        setPlanningNewTrip(false);
        return true;
      }
      if (journalPlace) {
        setJournalPlace(null);
        return true;
      }
      const previous = previousScreen(screen);
      if (!previous) return false;
      setScreen(previous);
      return true;
    });
    return () => handler.remove();
  }, [screen, detailPlace, selectedTrip, planningNewTrip, journalPlace]);
  async function logout() {
    if (!(await onLogout()))
      setNotice({ title: 'Çıkış yapılamadı', body: 'Oturum kapatılamadı. Lütfen yeniden dene.' });
  }
  const props = { name, go, setNotice };
  function closeDetail() {
    setDetailPlace(null);
  }
  return (
    <View
      style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }}
      pointerEvents={busy ? 'none' : 'auto'}
    >
      {(selectedTrip || planningNewTrip) && (
        <View style={{ flex: 1, display: detailPlace ? 'none' : 'flex' }}>
          <TripPlanningScreen
            trip={selectedTrip ?? undefined}
            onClose={() => {
              setSelectedTrip(null);
              setPlanningNewTrip(false);
            }}
            onDeleted={() => {
              setSelectedTrip(null);
              setScreen('trips');
            }}
            onSaved={() => {
              setSelectedTrip(null);
              setPlanningNewTrip(false);
              setScreen('trips');
            }}
            onOpenPlace={setDetailPlace}
          />
        </View>
      )}
      {detailPlace ? (
        <PlaceDetailScreen
          place={detailPlace}
          onClose={closeDetail}
          onAddToJournal={() => {
            setJournalPlace({ id: detailPlace.id, title: detailPlace.title });
            setDetailPlace(null);
            setSelectedTrip(null);
            setPlanningNewTrip(false);
            setScreen('journal');
          }}
        />
      ) : selectedTrip || planningNewTrip ? null : screen === 'profile' ? (
        <ProfileScreen
          {...props}
          onNameChange={setName}
          onLogout={() => void logout()}
          signingOut={busy}
          onOpenJournal={(tripId) => {
            setJournalTripRequest(tripId);
            setScreen('journal');
          }}
        />
      ) : screen === 'journal' ? (
        <JournalScreen
          {...props}
          pendingPlace={journalPlace}
          onPendingPlaceHandled={() => setJournalPlace(null)}
          requestedTripId={journalTripRequest}
          onRequestedTripHandled={() => setJournalTripRequest(null)}
        />
      ) : screen === 'explore' ? (
        <ExploreScreen {...props} onOpenPlace={setDetailPlace} />
      ) : screen === 'trips' ? (
        <TripsScreen
          {...props}
          onOpenTrip={setSelectedTrip}
          onPlanTrip={() => setPlanningNewTrip(true)}
        />
      ) : (
        <HomeScreen {...props} onOpenPlace={setDetailPlace} onOpenTrip={setSelectedTrip} />
      )}
      <NoticeModal notice={notice} onClose={() => setNotice(null)} />
    </View>
  );
}
