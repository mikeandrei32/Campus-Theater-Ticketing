import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { fetchAdminScanner, validateAdminTicket } from '../services/api';

// Safely load expo-camera for native iOS/Android so it never crashes if Metro wasn't restarted
let ExpoCameraView = null;
let ExpoCameraModule = null;
if (Platform.OS !== 'web') {
  try {
    const camPkg = require('expo-camera');
    ExpoCameraView = camPkg.CameraView || camPkg.Camera || null;
    ExpoCameraModule = camPkg.Camera || camPkg || null;
  } catch (e) {
    console.warn('expo-camera not available:', e?.message);
  }
}

export default function AdminScannerScreen({ onBackToCatalog }) {
  const [mode, setMode] = useState('manual'); // 'manual' | 'camera'
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('back');
  const [hasPermission, setHasPermission] = useState(null); // null | true | false
  const [cameraError, setCameraError] = useState(null);
  const [scanPaused, setScanPaused] = useState(false);

  const [stats, setStats] = useState({
    total_admitted: 0,
    pending_admission: 0,
    total_tickets: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const scanLockRef = useRef(false);
  const lastScannedTokenRef = useRef(null);
  const startingCameraRef = useRef(false);
  const inputRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const loadScannerInfo = useCallback(async () => {
    const res = await fetchAdminScanner();
    if (res && res.success) {
      if (res.stats) setStats(res.stats);
      if (Array.isArray(res.recent_bookings)) {
        setRecentBookings(res.recent_bookings);
      }
    }
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadScannerInfo();
    return () => {
      stopWebCamera();
    };
  }, [loadScannerInfo]);

  const submitToken = async (overrideToken) => {
    const rawToken = String(
      overrideToken !== undefined ? overrideToken : tokenInput
    ).trim();
    if (!rawToken) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await validateAdminTicket(rawToken);
      setResult(data);

      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      if (data && data.status === 'success') {
        const admittedNow = data.admitted_count || 1;
        setStats((prev) => ({
          ...prev,
          total_admitted: (prev.total_admitted || 0) + admittedNow,
          pending_admission: Math.max(
            0,
            (prev.pending_admission || 0) - admittedNow
          ),
        }));

        setHistory((prev) => [
          {
            time: timeStr,
            reference: data.booking_reference || rawToken,
            attendee: data.attendee || 'Attendee',
            seats: data.seat || 'Reserved Seat',
            status: 'success',
          },
          ...prev,
        ]);

        setTokenInput('');
      } else if (data && data.status === 'warning' && data.attendee) {
        setHistory((prev) => [
          {
            time: timeStr,
            reference: data.booking_reference || rawToken,
            attendee: data.attendee || 'Attendee',
            seats: data.seat || 'Reserved Seat',
            status: 'warning',
          },
          ...prev,
        ]);
      }

      loadScannerInfo();
    } catch (e) {
      setResult({
        status: 'error',
        message: 'Network or server error while validating ticket code.',
      });
    } finally {
      setLoading(false);
    }
  };

  const resumeNextScan = () => {
    scanLockRef.current = false;
    lastScannedTokenRef.current = null;
    setScanPaused(false);
    if (Platform.OS === 'web' && html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.resume();
      } catch (e) {
        // ignore if not paused
      }
    }
  };

  const resetResult = () => {
    setResult(null);
    setTokenInput('');
    resumeNextScan();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (
        Platform.OS === 'web' &&
        typeof navigator !== 'undefined' &&
        navigator.clipboard
      ) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const cleaned = text.trim();
          setTokenInput(cleaned);
          submitToken(cleaned);
        }
      } else if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (err) {
      // ignore clipboard errors
    }
  };

  // =========================================================================
  // WEB CAMERA QR SCANNER (Uses html5-qrcode just like scanner.blade.php)
  // =========================================================================
  const loadHtml5QrScript = () =>
    new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('No window'));
      if (window.Html5Qrcode) return resolve(window.Html5Qrcode);

      const existing = document.getElementById('html5-qrcode-script');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.Html5Qrcode));
        return;
      }

      const script = document.createElement('script');
      script.id = 'html5-qrcode-script';
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.async = true;
      script.onload = () => resolve(window.Html5Qrcode);
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });

  const startWebCamera = async (facing = cameraFacing) => {
    if (startingCameraRef.current) return;
    startingCameraRef.current = true;
    try {
      setCameraError(null);
      const Html5Qrcode = await loadHtml5QrScript();
      await stopWebCamera();

      const containerEl = document.getElementById('mseuf-mobile-qr-reader');
      if (!containerEl) {
        setCameraError('Camera container is initializing. Tap Start Camera again.');
        return;
      }
      containerEl.innerHTML = '';

      const scanner = new Html5Qrcode('mseuf-mobile-qr-reader');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: facing === 'front' ? 'user' : 'environment' },
        { fps: 8, qrbox: { width: 210, height: 210 } },
        (decodedText) => {
          const cleaned = String(decodedText || '').trim();
          if (
            !cleaned ||
            scanLockRef.current ||
            cleaned === lastScannedTokenRef.current
          ) {
            return;
          }
          scanLockRef.current = true;
          lastScannedTokenRef.current = cleaned;
          setScanPaused(true);
          try {
            scanner.pause(true);
          } catch (e) {
            // ignore pause error
          }
          setTokenInput(cleaned);
          submitToken(cleaned);
        },
        () => {
          // ignore frame scan misses
        }
      );

      setHasPermission(true);
      setCameraActive(true);
    } catch (err) {
      console.warn('Web camera error:', err);
      setCameraActive(false);
      setHasPermission(false);
      setCameraError(
        'Could not access camera. Make sure camera permissions are allowed in your browser or use a Quick-Select test pass below.'
      );
    } finally {
      startingCameraRef.current = false;
    }
  };

  const stopWebCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        // ignore stop error
      }
      try {
        await html5QrCodeRef.current.clear();
      } catch (e) {
        // ignore clear error
      }
      html5QrCodeRef.current = null;
    }
    if (typeof document !== 'undefined') {
      const containerEl = document.getElementById('mseuf-mobile-qr-reader');
      if (containerEl) containerEl.innerHTML = '';
    }
  };

  // =========================================================================
  // NATIVE & WEB UNIFIED CAMERA CONTROLS
  // =========================================================================
  const startCamera = async () => {
    setCameraError(null);
    scanLockRef.current = false;
    lastScannedTokenRef.current = null;
    setScanPaused(false);

    if (Platform.OS === 'web') {
      setCameraActive(true);
      setTimeout(() => {
        startWebCamera(cameraFacing);
      }, 150);
      return;
    }

    // Native (Android / iOS)
    try {
      if (
        ExpoCameraModule &&
        typeof ExpoCameraModule.requestCameraPermissionsAsync === 'function'
      ) {
        const { status } =
          await ExpoCameraModule.requestCameraPermissionsAsync();
        const granted = status === 'granted';
        setHasPermission(granted);
        if (!granted) {
          setCameraActive(false);
          setCameraError(
            'Camera permission was denied. Please enable Camera access in your phone Settings.'
          );
          return;
        }
      } else {
        setHasPermission(true);
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError(
        'Camera module failed to initialize. Restart Expo (`npx expo start -c`) or use the test chip below.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (Platform.OS === 'web') {
      await stopWebCamera();
    }
    scanLockRef.current = false;
    lastScannedTokenRef.current = null;
    setScanPaused(false);
    setCameraActive(false);
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleFlipCamera = async () => {
    const nextFacing = cameraFacing === 'back' ? 'front' : 'back';
    setCameraFacing(nextFacing);
    if (Platform.OS === 'web' && cameraActive) {
      await startWebCamera(nextFacing);
    }
  };

  const handleNativeBarcodeScanned = ({ data }) => {
    if (scanLockRef.current || scanPaused || loading || !data) return;
    const scannedValue = String(data).trim();
    if (!scannedValue || scannedValue === lastScannedTokenRef.current) return;

    scanLockRef.current = true;
    lastScannedTokenRef.current = scannedValue;
    setScanPaused(true);
    setTokenInput(scannedValue);
    submitToken(scannedValue);
  };

  const statusBadgeText = !result
    ? 'IDLE'
    : result.status === 'success'
      ? 'VALID PASS'
      : result.status === 'warning'
        ? 'DUPLICATE / USED'
        : 'INVALID';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadScannerInfo();
          }}
          colors={[COLORS.maroon]}
        />
      }
    >
      {/* Campus Tagline Banner */}
      <View style={styles.taglineBanner}>
        <Text style={styles.taglineBannerText}>
          MSEUF CAMPUS THEATER ADMIN & PLAY PUBLISHER • POST SHOWS FOR STUDENT MOBILE APP
        </Text>
      </View>

      <View style={styles.mainPadding}>
        {/* ===================================================================== */}
        {/* 1. TOP HEADER & METRIC SUMMARY (Matches tickets/scanner.blade.php)    */}
        {/* ===================================================================== */}
        <View style={styles.headerBlock}>
          <View>
            <View style={styles.breadcrumbRow}>
              <TouchableOpacity onPress={onBackToCatalog}>
                <Text style={styles.breadcrumbLink}>Shows & Plays</Text>
              </TouchableOpacity>
              <Text style={styles.breadcrumbSep}>›</Text>
              <Text style={styles.breadcrumbCurrent}>Gate Marshal Portal</Text>
            </View>

            <Text style={styles.pageTitle}>
              Digital Ticket & Booking Scanner
            </Text>
            <Text style={styles.pageSub}>
              Verify attendee admission by entering their{' '}
              <Text style={styles.maroonHighlight}>Booking Reference</Text> (e.g.{' '}
              <Text style={styles.monoInline}>MSEUF-XXXXXX</Text>) or scanning
              their <Text style={styles.maroonHighlight}>QR Token</Text>.
            </Text>
          </View>

          {/* Live Gate Stats */}
          <View style={styles.statsPillRow}>
            <View style={styles.admittedPill}>
              <View style={styles.emeraldDot} />
              <Text style={styles.admittedPillLabel}>
                Admitted:{' '}
                <Text style={styles.admittedPillCount}>
                  {stats.total_admitted}
                </Text>
              </Text>
            </View>

            <View style={styles.pendingPill}>
              <Text style={styles.pendingPillLabel}>
                Pending:{' '}
                <Text style={styles.pendingPillCount}>
                  {stats.pending_admission}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* ===================================================================== */}
        {/* 2. SCANNER / REFERENCE VERIFICATION CARD                              */}
        {/* ===================================================================== */}
        <View style={styles.scannerCard}>
          {/* Mode Switch Tabs */}
          <View style={styles.modeSwitchWrap}>
            <TouchableOpacity
              style={[
                styles.modeTab,
                mode === 'manual' && styles.modeTabActive,
              ]}
              onPress={() => {
                setMode('manual');
                stopCamera();
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.modeTabText,
                  mode === 'manual' && styles.modeTabTextActive,
                ]}
              >
                Booking Ref / Token Input
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeTab,
                mode === 'camera' && styles.modeTabActive,
              ]}
              onPress={() => {
                setMode('camera');
                startCamera();
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.modeTabText,
                  mode === 'camera' && styles.modeTabTextActive,
                ]}
              >
                Live Camera QR Scanner
              </Text>
            </TouchableOpacity>
          </View>

          {/* Manual / Barcode Scanner Input Form */}
          {mode === 'manual' ? (
            <View style={styles.manualSection}>
              <Text style={styles.inputLabel}>
                ENTER BOOKING REFERENCE OR QR TOKEN
              </Text>

              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={styles.tokenInput}
                  value={tokenInput}
                  onChangeText={setTokenInput}
                  placeholder="e.g. MSEUF-XXXXXX or UUID token..."
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  onSubmitEditing={() => submitToken()}
                  returnKeyType="done"
                />
                {Boolean(tokenInput) && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={() => {
                      setTokenInput('');
                      if (inputRef.current) inputRef.current.focus();
                    }}
                  >
                    <Text style={styles.clearBtnText}>×</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.verifyBtn,
                    (!tokenInput.trim() || loading) && { opacity: 0.45 },
                  ]}
                  onPress={() => submitToken()}
                  disabled={!tokenInput.trim() || loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <View style={styles.checkingRow}>
                      <ActivityIndicator color={COLORS.white} size="small" />
                      <Text style={styles.verifyBtnText}>Checking...</Text>
                    </View>
                  ) : (
                    <Text style={styles.verifyBtnText}>Verify Pass</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.tipAndPasteRow}>
                <Text style={styles.tipText}>
                  <Text style={styles.maroonHighlight}>Tip:</Text> Accepts Master
                  Booking Reference (all seats) or single-seat QR token.
                </Text>
                <TouchableOpacity
                  onPress={handlePasteClipboard}
                  style={styles.pasteBtn}
                >
                  <Text style={styles.pasteBtnText}>Paste</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Live Camera QR Scanner Container */
            <View style={styles.cameraContainer}>
              <View style={styles.cameraViewport}>
                {Platform.OS === 'web' ? (
                  <View style={styles.webCameraOuter}>
                    {/* Real DOM container for html5-qrcode on web */}
                    <View
                      nativeID="mseuf-mobile-qr-reader"
                      style={styles.webQrReaderBox}
                    />
                    {!cameraActive && (
                      <View style={styles.cameraOfflineOverlay}>
                        <View style={styles.cameraIconBadge}>
                          <Text style={styles.cameraIconBadgeText}>QR</Text>
                        </View>
                        <Text style={styles.cameraOfflineTitle}>
                          {cameraError ? 'Camera Unavailable' : 'Camera Offline'}
                        </Text>
                        <Text style={styles.cameraOfflineSub}>
                          {cameraError ||
                            'Click "Start Camera Scanner" below to activate your camera.'}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : cameraActive && hasPermission && ExpoCameraView ? (
                  <View style={styles.nativeCameraWrapper}>
                    <ExpoCameraView
                      style={styles.nativeCameraView}
                      facing={cameraFacing}
                      barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                      }}
                      onBarcodeScanned={
                        scanPaused || loading
                          ? undefined
                          : handleNativeBarcodeScanned
                      }
                    />
                    <View style={styles.reticleOverlay} pointerEvents="box-none">
                      <View style={styles.reticleBox} pointerEvents="none">
                        <View
                          style={[styles.reticleCorner, styles.cornerTopLeft]}
                        />
                        <View
                          style={[styles.reticleCorner, styles.cornerTopRight]}
                        />
                        <View
                          style={[
                            styles.reticleCorner,
                            styles.cornerBottomLeft,
                          ]}
                        />
                        <View
                          style={[
                            styles.reticleCorner,
                            styles.cornerBottomRight,
                          ]}
                        />
                      </View>
                      {scanPaused ? (
                        <TouchableOpacity
                          style={styles.scanNextOverlayBtn}
                          onPress={resumeNextScan}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.scanNextOverlayBtnText}>
                            ✓ QR Captured • Tap to Scan Next Pass
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.reticleHintText}>
                          Align student QR pass inside the frame
                        </Text>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.cameraOfflineBox}>
                    <View style={styles.cameraIconBadge}>
                      <Text style={styles.cameraIconBadgeText}>QR</Text>
                    </View>
                    <Text style={styles.cameraOfflineTitle}>
                      {cameraError
                        ? 'Camera Notice'
                        : hasPermission === false
                          ? 'Camera Permission Required'
                          : 'Camera Offline'}
                    </Text>
                    <Text style={styles.cameraOfflineSub}>
                      {cameraError ||
                        (hasPermission === false
                          ? 'Please grant camera permission to scan student QR passes.'
                          : 'Tap "Start Camera Scanner" below to activate the gate camera.')}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.cameraControlsRow}>
                <TouchableOpacity
                  style={styles.cameraToggleBtn}
                  onPress={toggleCamera}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cameraToggleBtnText}>
                    {cameraActive ? 'Stop Camera' : 'Start Camera Scanner'}
                  </Text>
                </TouchableOpacity>

                {cameraActive && scanPaused && (
                  <TouchableOpacity
                    style={styles.resumeScanBtn}
                    onPress={resumeNextScan}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.resumeScanBtnText}>
                      Scan Next QR Pass
                    </Text>
                  </TouchableOpacity>
                )}

                {cameraActive && (
                  <TouchableOpacity
                    style={styles.flipCameraBtn}
                    onPress={handleFlipCamera}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.flipCameraBtnText}>Flip Camera</Text>
                  </TouchableOpacity>
                )}

                {recentBookings.length > 0 && (
                  <TouchableOpacity
                    style={styles.simulateScanBtn}
                    onPress={() => {
                      const sample = recentBookings[0];
                      const sampleToken =
                        sample.tickets?.[0]?.qr_token ||
                        sample.booking_reference;
                      setTokenInput(sampleToken);
                      submitToken(sampleToken);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.simulateScanBtnText}>
                      Simulate QR Scan
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Gate Marshal Guidelines */}
          <View style={styles.guidelinesGrid}>
            <View style={styles.guidelineBox}>
              <Text style={styles.guidelineTitle}>Verification Options</Text>
              <Text style={styles.guidelineText}>
                Marshals can scan the QR code or directly type/paste the 6-character booking reference code.
              </Text>
            </View>

            <View style={styles.guidelineBox}>
              <Text style={styles.guidelineTitle}>Double-Entry Protection</Text>
              <Text style={styles.guidelineText}>
                Already checked-in passes will trigger an amber alert to prevent pass sharing.
              </Text>
            </View>
          </View>

          {/* Quick Test Sample References (Matches tickets/scanner.blade.php) */}
          {recentBookings.length > 0 && (
            <View style={styles.quickSelectSection}>
              <Text style={styles.quickSelectTitle}>
                QUICK-SELECT ACTIVE RESERVATION FOR TEST:
              </Text>
              <View style={styles.quickSelectWrap}>
                {recentBookings.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={styles.quickChip}
                    onPress={() => {
                      setTokenInput(b.booking_reference);
                      submitToken(b.booking_reference);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.quickChipRef}>
                      {b.booking_reference}
                    </Text>
                    <Text style={styles.quickChipSeats}>
                      ({b.total_seats} seats)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ===================================================================== */}
        {/* 3. VERIFICATION RESULT LIVE CARD (Matches tickets/scanner.blade.php)   */}
        {/* ===================================================================== */}
        <View style={styles.resultCard}>
          <View>
            <View style={styles.resultHeaderRow}>
              <Text style={styles.resultHeaderTitle}>
                VERIFICATION STATUS DISPLAY
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  !result
                    ? styles.statusBadgeIdle
                    : result.status === 'success'
                      ? styles.statusBadgeSuccess
                      : result.status === 'warning'
                        ? styles.statusBadgeWarning
                        : styles.statusBadgeError,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    !result
                      ? { color: '#6B7280' }
                      : result.status === 'success'
                        ? { color: '#065F46' }
                        : result.status === 'warning'
                          ? { color: '#92400E' }
                          : { color: '#991B1B' },
                  ]}
                >
                  {statusBadgeText}
                </Text>
              </View>
            </View>

            {/* Idle / Waiting State */}
            {!result && !loading && (
              <View style={styles.idleBox}>
                <View style={styles.scanCircle}>
                  <Text style={styles.scanCircleText}>SCAN</Text>
                </View>
                <Text style={styles.idleTitle}>Ready to Verify Pass</Text>
                <Text style={styles.idleSub}>
                  Enter an attendee's booking reference or scan their QR token to view admission details.
                </Text>
              </View>
            )}

            {/* Loading State */}
            {loading && (
              <View style={styles.idleBox}>
                <ActivityIndicator size="large" color={COLORS.maroon} />
                <Text style={styles.loadingText}>Verifying in database...</Text>
              </View>
            )}

            {/* Active Result State */}
            {result && !loading && (
              <View style={styles.activeResultWrap}>
                {/* Status Banner */}
                <View
                  style={[
                    styles.statusBanner,
                    result.status === 'success'
                      ? styles.statusBannerSuccess
                      : result.status === 'warning'
                        ? styles.statusBannerWarning
                        : styles.statusBannerError,
                  ]}
                >
                  <View
                    style={[
                      styles.statusIconBox,
                      result.status === 'success'
                        ? { backgroundColor: '#A7F3D0' }
                        : result.status === 'warning'
                          ? { backgroundColor: '#FDE68A' }
                          : { backgroundColor: '#FECACA' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusIconText,
                        result.status === 'success'
                          ? { color: '#064E3B' }
                          : result.status === 'warning'
                            ? { color: '#78350F' }
                            : { color: '#7F1D1D' },
                      ]}
                    >
                      {result.status === 'success'
                        ? '✓'
                        : result.status === 'warning'
                          ? '!'
                          : '✕'}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.statusBannerHeading,
                        result.status === 'success'
                          ? { color: '#064E3B' }
                          : result.status === 'warning'
                            ? { color: '#78350F' }
                            : { color: '#7F1D1D' },
                      ]}
                    >
                      {result.status === 'success'
                        ? 'ADMISSION GRANTED'
                        : result.status === 'warning'
                          ? 'PASS ALREADY ADMITTED'
                          : 'INVALID ADMISSION CODE'}
                    </Text>
                    <Text
                      style={[
                        styles.statusBannerMsg,
                        result.status === 'success'
                          ? { color: '#065F46' }
                          : result.status === 'warning'
                            ? { color: '#92400E' }
                            : { color: '#991B1B' },
                      ]}
                    >
                      {result.message}
                    </Text>
                  </View>
                </View>

                {/* Attendee & Show Details */}
                {Boolean(result.attendee) && (
                  <View style={styles.attendeeDetailCard}>
                    <View style={styles.attendeeTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailFieldLabel}>ATTENDEE</Text>
                        <Text style={styles.detailAttendeeName}>
                          {result.attendee}
                        </Text>
                        {Boolean(result.attendee_email) && (
                          <Text style={styles.detailAttendeeEmail}>
                            {result.attendee_email}
                          </Text>
                        )}
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.detailFieldLabel}>
                          REFERENCE CODE
                        </Text>
                        <Text style={styles.detailBookingRef}>
                          {result.booking_reference}
                        </Text>
                        <View
                          style={[
                            styles.paymentTypePill,
                            result.payment_status === 'free'
                              ? { backgroundColor: '#D1FAE5' }
                              : { backgroundColor: COLORS.maroonPale },
                          ]}
                        >
                          <Text
                            style={[
                              styles.paymentTypePillText,
                              result.payment_status === 'free'
                                ? { color: '#065F46' }
                                : { color: COLORS.maroonDark },
                            ]}
                          >
                            {result.payment_status === 'free'
                              ? 'FREE PASS'
                              : 'PAID (GCASH)'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {Boolean(result.event_title) && (
                      <View style={styles.showDetailBlock}>
                        <Text style={styles.detailFieldLabel}>CAMPUS SHOW</Text>
                        <Text style={styles.detailShowTitle}>
                          {result.event_title}
                        </Text>
                        <Text style={styles.detailShowVenue}>
                          {result.event_venue} • {result.event_date || ''}
                        </Text>
                      </View>
                    )}

                    {/* Seats Badges */}
                    <View style={styles.seatsDetailBlock}>
                      <View style={styles.seatsDetailHeader}>
                        <Text style={styles.detailFieldLabel}>
                          RESERVED SEATS ({result.total_seats || 1})
                        </Text>
                        <Text style={styles.verificationModeText}>
                          {result.verification_type === 'booking_reference'
                            ? 'All Seats in Booking'
                            : 'Single Seat Pass'}
                        </Text>
                      </View>

                      <View style={styles.seatsBadgesWrap}>
                        {(result.seats_list || []).map((s, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.resultSeatBadge,
                              s.is_vip
                                ? styles.resultSeatBadgeVip
                                : styles.resultSeatBadgeReg,
                            ]}
                          >
                            {s.is_vip && (
                              <Text style={styles.resultSeatVipStar}>
                                ★ VIP{' '}
                              </Text>
                            )}
                            <Text
                              style={[
                                styles.resultSeatCodeText,
                                s.is_vip
                                  ? { color: '#78350F' }
                                  : { color: COLORS.maroonDark },
                              ]}
                            >
                              {s.seat_code}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Check-in Timestamp */}
                    <View style={styles.timestampRow}>
                      <Text style={styles.timestampLabel}>Verified Time:</Text>
                      <Text style={styles.timestampValue}>
                        {result.checked_in_at || 'Just now'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Footer Action Buttons (Matches lines 310-320 of scanner.blade.php) */}
          <View style={styles.resultFooterRow}>
            {result ? (
              <TouchableOpacity onPress={resetResult}>
                <Text style={styles.clearReadyNextBtn}>Clear & Ready Next</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <Text style={styles.sessionAdmissionsCounter}>
              Session admissions:{' '}
              <Text style={styles.sessionAdmissionsCountBold}>
                {history.length}
              </Text>
            </Text>
          </View>
        </View>

        {/* ===================================================================== */}
        {/* 4. LIVE SESSION GATE ADMISSIONS LOG (Matches scanner.blade.php)       */}
        {/* ===================================================================== */}
        {history.length > 0 && (
          <View style={styles.sessionLogCard}>
            <View style={styles.sessionLogHeader}>
              <Text style={styles.sessionLogTitle}>
                Recent Gate Admissions (This Session)
              </Text>
              <TouchableOpacity onPress={() => setHistory([])}>
                <Text style={styles.clearSessionLogBtn}>Clear Session Log</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.logTable}>
              <View style={styles.logTableHeader}>
                <Text style={[styles.logTh, { flex: 1 }]}>TIME</Text>
                <Text style={[styles.logTh, { flex: 1.4 }]}>BOOKING REF</Text>
                <Text style={[styles.logTh, { flex: 1.5 }]}>ATTENDEE</Text>
                <Text style={[styles.logTh, { flex: 1.4 }]}>SEATS</Text>
                <Text style={[styles.logTh, { flex: 1.2, textAlign: 'right' }]}>
                  STATUS
                </Text>
              </View>

              {history.map((item, idx) => (
                <View key={idx} style={styles.logTableRow}>
                  <Text style={[styles.logTdTime, { flex: 1 }]}>
                    {item.time}
                  </Text>
                  <Text style={[styles.logTdRef, { flex: 1.4 }]}>
                    {item.reference}
                  </Text>
                  <Text
                    style={[styles.logTdAttendee, { flex: 1.5 }]}
                    numberOfLines={1}
                  >
                    {item.attendee}
                  </Text>
                  <Text
                    style={[styles.logTdSeats, { flex: 1.4 }]}
                    numberOfLines={1}
                  >
                    {item.seats}
                  </Text>
                  <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                    <View
                      style={[
                        styles.logStatusBadge,
                        item.status === 'success'
                          ? { backgroundColor: '#D1FAE5' }
                          : { backgroundColor: '#FEF3C7' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.logStatusBadgeText,
                          item.status === 'success'
                            ? { color: '#065F46' }
                            : { color: '#92400E' },
                        ]}
                      >
                        {item.status === 'success'
                          ? 'Admitted'
                          : 'Already Admitted'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  taglineBanner: {
    backgroundColor: COLORS.maroonPale,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.maroonBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  taglineBannerText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.maroon,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  mainPadding: {
    padding: 16,
    gap: 18,
  },
  headerBlock: {
    gap: 10,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  breadcrumbLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  breadcrumbSep: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  breadcrumbCurrent: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  pageSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  maroonHighlight: {
    fontWeight: '800',
    color: COLORS.maroon,
  },
  monoInline: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statsPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  admittedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
  },
  emeraldDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  admittedPillLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  admittedPillCount: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  pendingPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
  },
  pendingPillLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  pendingPillCount: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  scannerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },
  modeSwitchWrap: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  modeTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
  },
  modeTabActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#4B5563',
  },
  modeTabTextActive: {
    color: COLORS.maroonDark,
    fontWeight: '900',
  },
  manualSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#374151',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 5,
  },
  tokenInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    paddingVertical: 8,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textMuted,
  },
  verifyBtn: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  checkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifyBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  tipAndPasteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  pasteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pasteBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  cameraContainer: {
    gap: 12,
  },
  cameraViewport: {
    backgroundColor: '#111827',
    borderRadius: 18,
    minHeight: 280,
    borderWidth: 2,
    borderColor: COLORS.maroon,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  webCameraOuter: {
    width: '100%',
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  webQrReaderBox: {
    width: '100%',
    minHeight: 280,
  },
  cameraOfflineOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#111827',
  },
  nativeCameraWrapper: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  nativeCameraView: {
    width: '100%',
    height: 280,
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  reticleBox: {
    width: 190,
    height: 190,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    position: 'relative',
  },
  reticleCorner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: COLORS.vipGold,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  reticleHintText: {
    marginTop: 12,
    color: COLORS.white,
    fontSize: 11.5,
    fontWeight: '800',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  scanNextOverlayBtn: {
    marginTop: 12,
    backgroundColor: COLORS.vipGold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  scanNextOverlayBtnText: {
    color: '#3D0000',
    fontSize: 12,
    fontWeight: '900',
  },
  resumeScanBtn: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: COLORS.success,
    borderRadius: 12,
  },
  resumeScanBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  cameraOfflineBox: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cameraIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: COLORS.vipGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cameraIconBadgeText: {
    color: COLORS.vipGold,
    fontSize: 14,
    fontWeight: '900',
  },
  cameraOfflineTitle: {
    color: COLORS.white,
    fontSize: 14.5,
    fontWeight: '800',
  },
  cameraOfflineSub: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 300,
  },
  cameraControlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cameraToggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.maroon,
    borderRadius: 12,
  },
  cameraToggleBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  flipCameraBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  flipCameraBtnText: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '800',
  },
  simulateScanBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.vipBorder,
  },
  simulateScanBtnText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800',
  },
  guidelinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  guidelineBox: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guidelineTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  guidelineText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  quickSelectSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  quickSelectTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  quickSelectWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickChipRef: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
  },
  quickChipSeats: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusBadgeIdle: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeError: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  idleBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  scanCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  scanCircleText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#6B7280',
  },
  idleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
  },
  idleSub: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  activeResultWrap: {
    gap: 14,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusBannerSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  statusBannerWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  statusBannerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  statusIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconText: {
    fontSize: 18,
    fontWeight: '900',
  },
  statusBannerHeading: {
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  statusBannerMsg: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  attendeeDetailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  attendeeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailFieldLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  detailAttendeeName: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  detailAttendeeEmail: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  detailBookingRef: {
    fontSize: 13.5,
    fontWeight: '900',
    color: COLORS.maroon,
    marginTop: 2,
  },
  paymentTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 3,
  },
  paymentTypePillText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  showDetailBlock: {
    gap: 2,
  },
  detailShowTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  detailShowVenue: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  seatsDetailBlock: {
    gap: 6,
  },
  seatsDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verificationModeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  seatsBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  resultSeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  resultSeatBadgeVip: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  resultSeatBadgeReg: {
    backgroundColor: COLORS.maroonPale,
    borderColor: COLORS.maroonBorder,
  },
  resultSeatVipStar: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B45309',
  },
  resultSeatCodeText: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  timestampLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  timestampValue: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  resultFooterRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearReadyNextBtn: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  sessionAdmissionsCounter: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  sessionAdmissionsCountBold: {
    fontWeight: '900',
    color: COLORS.maroon,
  },
  sessionLogCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sessionLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionLogTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  clearSessionLogBtn: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  logTable: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logTh: {
    fontSize: 10,
    fontWeight: '900',
    color: '#374151',
    letterSpacing: 0.4,
  },
  logTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logTdTime: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  logTdRef: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  logTdAttendee: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    paddingRight: 4,
  },
  logTdSeats: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    paddingRight: 4,
  },
  logStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  logStatusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
});
