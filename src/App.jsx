import { useRef, useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import BingoCard from './components/BingoCard';
import GameCanvas from './components/GameCanvas';
import SideMenu from './components/SideMenu';
import BucketRow from './components/BucketRow';
import Footer from './components/Footer';
import { useGameLogic } from './hooks/useGameLogic';
import { useTheme } from './hooks/useTheme';
import { useSound } from './hooks/useSound';
import { loadJSON, saveJSON } from './utils/storage';

const AUDIO_STORAGE_KEY = 'bplm.audio.v1';

import MagicNumberModal from './components/Modal/MagicNumberModal';
import MessageModal from './components/Modal/MessageModal';
import GameOverModal from './components/Modal/GameOverModal';
import NextLevelModal from './components/Modal/NextLevelModal';
import FireballModal from './components/Modal/FireballModal';
import LuckySpin from './components/LuckySpin';
import CloudBackup from './components/CloudBackup';
import { useRewardedAd } from './hooks/useRewardedAd';
import { adsAvailable } from './services/rewardedAds';
import { useAutomaticProgress } from './hooks/useAutomaticProgress';

export default function App() {
  const { busy: adBusy, watch } = useRewardedAd();
  const [canvasGeneration, setCanvasGeneration] = useState(0);
  const [audioSettings, setAudioSettings] = useState({
    music: 1, // 0: Off, 0.5: Low, 1: High
    sfx: 1,
    vibration: 1
  });
  const audioHydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadJSON(AUDIO_STORAGE_KEY).then(saved => {
      if (cancelled) return;
      if (saved) {
        setAudioSettings(prev => ({ ...prev, ...saved }));
      }
      audioHydratedRef.current = true;
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!audioHydratedRef.current) return;
    saveJSON(AUDIO_STORAGE_KEY, audioSettings).catch(() => {});
  }, [audioSettings]);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState('FINGO');

  const {
    state: { coins, balls, level, levels, isReady, storageError, bingoCard, slotsResult, winState, winReward, phase, fireBallActive, magicActive, luckySpinReward },
    actions: { initLevel, startSpin, dropBall, resolveTurn, buyItem, nextLevel, spinLuckySpin, claimLuckySpinReward, completeLuckySpin, restoreProgress }
  } = useGameLogic(gameMode);
  const progress = useMemo(() => ({ coins, levels }), [coins, levels]);
  const cloud = useAutomaticProgress({
    progress, ready: isReady, canRestore: !gameStarted && !adBusy,
    apply: value => {
      if (gameStarted || adBusy) throw new Error('Aguarde a volta ao início.');
      restoreProgress(value);
      setCanvasGeneration(count => count + 1);
    },
  });

  // Target columns that have useful (unmarked matching) numbers or magic mode active
  const goldenCols = useMemo(() => {
    if (magicActive) return [0, 1, 2, 3, 4];
    if (!slotsResult || !bingoCard) return [];
    const cols = [];
    slotsResult.forEach((num, idx) => {
      const cell = bingoCard.find(c => c.num === num);
      if (cell && !cell.marked) {
        cols.push(idx);
      }
    });
    return cols;
  }, [slotsResult, bingoCard, magicActive]);

  const {
    getImage,
    getImmutableImage,
    getSound,
    getImmutableSound
  } = useTheme();

  // Audio: ducks BGM to 90% during Lucky Spin so the wheel ticker stays audible.
  const baseBgmVolume = adBusy ? 0 : 0.3 * audioSettings.music;
  const bgmVolume = phase === 'BONUS_WHEEL' ? baseBgmVolume * 0.9 : baseBgmVolume;

  const { play: playTheme, stop: stopTheme } = useSound(getImmutableSound('Theme.mp3'), { volume: baseBgmVolume, loop: true });
  const { play: playBGM, stop: stopBGM } = useSound(getSound('song.mp3'), { volume: bgmVolume, loop: true });
  const { play: playSpin, stop: stopSpin } = useSound(getImmutableSound('slot.mp3'), { volume: 0.05 * audioSettings.sfx, loop: true });
  const { play: playPeg } = useSound(getSound('peg.mp3'), { volume: 1.0 * audioSettings.sfx, multi: true });
  const { play: playClick } = useSound(getSound('buttons.mp3'), { volume: 0.25 * audioSettings.sfx });
  // Fireball SFX
  const { play: playFireball, stop: stopFireball } = useSound(getImmutableSound('fireball.mp3'), { volume: 0.3 * audioSettings.sfx, loop: true });
  const { play: playExplosion } = useSound(getImmutableSound('explosion.mp3'), { volume: 1.0 * audioSettings.sfx });
  const { play: playLucky } = useSound(getImmutableSound('lucky.mp3'), { volume: 0.2 * audioSettings.sfx });
  const { play: playBingo } = useSound(getImmutableSound('BINGO!.mp3'), { volume: 0.2 * audioSettings.sfx });
  const { play: playPalheta } = useSound(getImmutableSound('palheta.mp3'), { volume: 0.7 * audioSettings.sfx });

  // 1. Manage Home Screen Theme Music
  useEffect(() => {
    if (!gameStarted) {
      stopBGM();

      if (audioSettings.music > 0) {
        // Attempt immediate playback
        playTheme();

        // Autoplay policy fallback: unlock immediately on ANY user gesture anywhere on screen
        const unlockEvents = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'];
        const handleUnlock = () => {
          if (!gameStarted && audioSettings.music > 0) {
            playTheme();
          }
        };

        unlockEvents.forEach(evt => window.addEventListener(evt, handleUnlock, { capture: true, passive: true }));
        return () => {
          unlockEvents.forEach(evt => window.removeEventListener(evt, handleUnlock, { capture: true }));
        };
      } else {
        stopTheme();
      }
    } else {
      // When leaving home screen, ensure theme is stopped
      stopTheme();
    }
  }, [gameStarted, audioSettings.music, playTheme, stopTheme, stopBGM]);

  // 2. Manage In-Game BGM
  useEffect(() => {
    if (!gameStarted) return;

    const isGameActive = (phase !== 'GAME_OVER' && phase !== 'VICTORY');
    if (isGameActive && audioSettings.music > 0) {
      playBGM();

      // Autoplay fallback for in-game if blocked
      const unlockEvents = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'];
      const handleGameUnlock = () => {
        if (isGameActive && audioSettings.music > 0) {
          playBGM();
        }
      };
      unlockEvents.forEach(evt => window.addEventListener(evt, handleGameUnlock, { capture: true, passive: true }));
      return () => {
        unlockEvents.forEach(evt => window.removeEventListener(evt, handleGameUnlock, { capture: true }));
      };
    } else {
      stopBGM();
    }
  }, [gameStarted, phase, audioSettings.music, playBGM, stopBGM]);

  // Manage Spin Sound
  useEffect(() => {
    if (phase === 'SPINNING') {
      playSpin();
    } else {
      stopSpin();
    }
  }, [phase, playSpin, stopSpin]);

  // New Message Modal State
  const [messageModal, setMessageModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const [showMagicModal, setShowMagicModal] = useState(false);
  const [showFireballConfirm, setShowFireballConfirm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helper to show modal
  const showMessage = (type, title, message, autoCloseDuration = 0) => {
    setMessageModal({ isOpen: true, type, title, message });

    if (autoCloseDuration > 0) {
      setTimeout(() => {
        closeMessage();
      }, autoCloseDuration);
    }
  };

  const closeMessage = () => {
    setMessageModal(prev => ({ ...prev, isOpen: false }));
  };
  const watchReward = async (item, number = null) => {
    if (!isReady || !gameStarted) return false;
    if (item === 'continue' ? phase !== 'GAME_OVER' : !['SPIN', 'DROP'].includes(phase)) return false;
    try {
      const granted = await watch(() => {
        if (item === 'magic') return startSpin(number);
        return buyItem(item, 0);
      });
      if (!granted) showMessage('info', 'Sem recompensa', 'Conclua o vídeo para receber a recompensa.');
      return granted;
    } catch {
      showMessage('info', 'Anúncio indisponível', 'Tente novamente mais tarde. Nenhuma moeda foi cobrada.');
      return false;
    }
  };
  const canvasRef = useRef();

  const handleSlotClick = (colIndex) => {
    if (phase !== 'DROP' || balls <= 0) return;
    const isFire = fireBallActive;

    // Confirm canvas is ready and physical ball is created before deducting ball
    const dropped = canvasRef.current?.dropBall(colIndex, isFire);
    if (dropped) {
      dropBall(colIndex);

      // SFX for Fireball
      if (isFire) {
        playFireball();
      }
    }
  };

  const handleMagicSpin = (number, cost) => {
    // 1. Verify player has enough coins first
    if (coins < cost) {
      showMessage('minimal', 'NOT ENOUGH COINS', '', 1200);
      return;
    }

    // 2. Attempt spin first; only charge coins if spin is accepted
    const spinStarted = startSpin(number);
    if (spinStarted) {
      buyItem('magic', cost);
    }
  };

  const handleBallLanded = (binIndex, isFireball = false) => {
    // 1. Handle Fireball SFX
    if (isFireball) {
      stopFireball();
      playExplosion();
    }

    const landedNumber = slotsResult[binIndex];
    const result = resolveTurn(landedNumber, binIndex);

    // Trigger Feedback
    if (result) {
      if (result.hit) {
        // Show "LUCK!" only if game continues (Not Bingo AND Not Defeat)
        if (!result.hasBingo && !result.isDefeat) {
          playLucky();
          showMessage('celebration', 'LUCKY!', `+${result.earned}🟡`, 1750);
        }
      } else {
        // Minimal Try Again - Only loop if NOT Game Over
        if (!result.isDefeat) {
          showMessage('minimal', 'TRY AGAIN', '', 1000);
        }
      }
    }
  };

  return (
    <div
      className="w-full h-[100dvh] flex flex-col relative overflow-hidden md:max-w-md mx-auto shadow-2xl md:border-x-2 border-gray-200 font-sans select-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      style={{
        backgroundImage: `url(${getImage('Background.jpg')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* HOME SCREEN OVERLAY */}
      {!gameStarted && (
        <div
          className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center"
        >
          {/* Background Image */}
          <img
            src={getImmutableImage('Home.png')}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Game Mode Buttons */}
          <button onClick={() => setIsMenuOpen(true)} className="absolute top-4 right-4 z-10 rounded-full bg-white/90 text-gray-900 px-4 py-2 text-sm font-semibold">
            Progresso e ajustes
          </button>
          <div className="relative z-10 flex flex-col gap-6 items-center mt-[40vh]">
            {/* Bingo (New Mode) */}
            <button
              onClick={() => {
                playClick();
                if (gameMode === 'BINGO') {
                  initLevel();
                } else {
                  setGameMode('BINGO');
                }
                setGameStarted(true);
              }}
              className="w-64 transition-transform hover:scale-105 active:scale-95"
            >
              <img src={getImmutableImage('BingoButton.png')} alt="Bingo" className="w-full drop-shadow-2xl" />
            </button>

            {/* Fingo (Standard Mode) */}
            <button
              onClick={() => {
                playClick();
                if (gameMode === 'FINGO') {
                  initLevel();
                } else {
                  setGameMode('FINGO');
                }
                setGameStarted(true);
              }}
              className="w-64 transition-transform hover:scale-105 active:scale-95"
            >
              <img src={getImmutableImage('FingoButton.png')} alt="Fingo" className="w-full drop-shadow-2xl" />
            </button>

            {/* Spingo (New Mode) */}
            <button
              onClick={() => {
                playClick();
                if (gameMode === 'SPINGO') {
                  initLevel();
                } else {
                  setGameMode('SPINGO');
                }
                setGameStarted(true);
              }}
              className="w-64 transition-transform hover:scale-105 active:scale-95"
            >
              <img src={getImmutableImage('SpingoButton.png')} alt="Spingo" className="w-full drop-shadow-2xl" />
            </button>
          </div>
        </div>
      )}

      <Header
        level={level}
        coins={coins}
        onOpenMenu={() => {
          playClick();
          setIsMenuOpen(true);
        }}
        getImage={getImage}
        getImmutableImage={getImmutableImage}
      />

      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onGoHome={() => {
          setIsMenuOpen(false);
          setGameStarted(false);
        }}
        settings={audioSettings}
        onUpdateSettings={setAudioSettings}
      >
        <CloudBackup cloud={cloud} canRestore={!gameStarted && !adBusy} progress={progress} />
      </SideMenu>

      {/* Bingo Card (Compact: 85% width) */}
      <div className="flex-shrink-0 w-full flex justify-center pb-0 bg-white/10 backdrop-blur-md z-10 border-b border-white/20">
        <div className="w-[85%] max-w-[360px]">
          <BingoCard
            card={bingoCard}
            level={level}
            getImage={getImage}
          />
        </div>
      </div>

      {/* Physics Area + Interactive Pipes */}
      <div className="flex-1 w-full relative bg-transparent overflow-hidden shadow-inner mt-[10px]">
        <div className="absolute inset-0">
          <GameCanvas
            key={canvasGeneration}
            ref={canvasRef}
            onBallLanded={handleBallLanded}
            onPegHit={playPeg}
            vibrationLevel={audioSettings.vibration}
            getImage={getImage}
            goldenCols={goldenCols}
          />
        </div>

        {/* Overlay Interactive Pipes */}
        <BucketRow
          slotsResult={slotsResult}
          bingoCard={bingoCard}
          onSlotClick={handleSlotClick}
          phase={phase}
          fireBallActive={fireBallActive}
          magicActive={magicActive}
          playClick={playClick}
        />
      </div>

      {/* Compact Footer */}
      <div className="flex-shrink-0 z-30">
        <Footer
          phase={phase}
          coins={coins}
          balls={balls}
          onSpin={(val) => {
            playClick();
            startSpin(val);
          }}
          onPowerUp={(type) => {
            playClick();
            if (type === 'fireball') {
              setShowFireballConfirm(true);
            }
            else if (type === 'magic') setShowMagicModal(true);
          }}
          getImage={getImage}
        />
      </div>

      <MagicNumberModal
        watchReward={watchReward}
        adsAvailable={adsAvailable}
        isOpen={showMagicModal}
        onClose={() => setShowMagicModal(false)}
        coins={coins}
        onMagicSpin={handleMagicSpin}
        showMessage={showMessage}
        bingoCard={bingoCard}
        playClick={playClick}
      />

      <FireballModal
        watchReward={watchReward}
        adsAvailable={adsAvailable}
        isOpen={showFireballConfirm}
        onClose={() => setShowFireballConfirm(false)}
        coins={coins}
        buyItem={buyItem}
        showMessage={showMessage}
        playClick={playClick}
      />

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeMessage}
        type={messageModal.type}
        title={messageModal.title}
        message={messageModal.message}
      />


      {/* Game Over / Next Level Logic */}
      {(phase === 'GAME_OVER' || phase === 'VICTORY') && (
        winState ? (
          <NextLevelModal
            level={level}
            reward={winReward || ((gameMode === 'BINGO' ? 300 : gameMode === 'SPINGO' ? 50 : 100) + level)}
            onNextLevel={nextLevel}
            playClick={playClick}
            playBingo={playBingo}
          />
        ) : (
          <GameOverModal
            watchReward={watchReward}
            adsAvailable={adsAvailable}
            coins={coins}
            onRestart={initLevel}
            buyItem={buyItem}
            showMessage={showMessage}
            playClick={playClick}
          />
        )
      )}

      {/* Lucky Wheel Bonus Phase */}
      {phase === 'BONUS_WHEEL' && (
        <LuckySpin
          spinLuckySpin={spinLuckySpin}
          claimLuckySpinReward={claimLuckySpinReward}
          completeLuckySpin={completeLuckySpin}
          reward={luckySpinReward}
          playTicker={playPalheta}
        />
      )}
      {adBusy && <div className="absolute inset-0 z-[200] bg-black/80 text-white flex items-center justify-center" role="status">Aguarde o anúncio…</div>}
      {storageError && <p role="alert" className="absolute bottom-0 inset-x-0 z-[210] bg-red-900 text-white p-3 text-sm">Não foi possível confirmar o salvamento. Libere espaço no aparelho. { !isReady && <button onClick={() => window.location.reload()}>Tentar novamente</button>}</p>}
      {(!isReady || cloud.booting || cloud.status === 'connecting' || cloud.status === 'restoring') && <div className="absolute inset-0 z-[200] bg-black/80 text-white flex items-center justify-center" role="status">Carregando progresso…</div>}
    </div>
  );
}
