import React, { useState, useEffect } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import QRCode from 'qrcode';

export default function QRCodeView({
  value = 'MSEUF-PASS',
  size = 160,
  color = '#6E0000',
  backgroundColor = '#FFFFFF',
}) {
  const [dataUrl, setDataUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function generateQR() {
      try {
        setLoading(true);
        const url = await QRCode.toDataURL(value, {
          width: size * 2, // 2x density for ultra-crisp display on retina screens
          margin: 1,
          color: {
            dark: color,
            light: backgroundColor,
          },
          errorCorrectionLevel: 'M',
        });

        if (isMounted) {
          setDataUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Local QRCode generation fallback:', err);
        if (isMounted) {
          // Fallback to online high-res QR endpoint
          const fallback = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            value
          )}&color=${color.replace('#', '')}&bgcolor=${backgroundColor.replace(
            '#',
            ''
          )}&margin=1`;
          setDataUrl(fallback);
          setLoading(false);
        }
      }
    }

    generateQR();

    return () => {
      isMounted = false;
    };
  }, [value, size, color, backgroundColor]);

  return (
    <View style={[styles.wrapper, { width: size + 20, height: size + 20 }]}>
      {loading && !dataUrl ? (
        <View style={[styles.loadingBox, { width: size, height: size }]}>
          <ActivityIndicator size="small" color="#6E0000" />
        </View>
      ) : (
        <Image
          source={{ uri: dataUrl }}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
});
