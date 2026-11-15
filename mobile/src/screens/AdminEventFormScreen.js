import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import {
  PRESET_POSTERS,
  createAdminEvent,
  updateAdminEvent,
} from '../services/api';

export default function AdminEventFormScreen({
  eventToEdit = null,
  onCancel,
  onSaved,
}) {
  const isEditing = Boolean(eventToEdit && eventToEdit.id);

  const [title, setTitle] = useState(eventToEdit?.title || '');
  const [venue] = useState('Little Theater, AEC Building');
  const [showDate, setShowDate] = useState(
    eventToEdit?.show_date_input
      ? eventToEdit.show_date_input.replace('T', ' ')
      : '2026-12-10 18:00'
  );
  const [pricingType, setPricingType] = useState(
    eventToEdit?.pricing_type || 'paid'
  );
  const [regularPrice, setRegularPrice] = useState(
    eventToEdit?.regular_price !== undefined
      ? String(Number(eventToEdit.regular_price).toFixed(0))
      : '150'
  );
  const [vipPrice, setVipPrice] = useState(
    eventToEdit?.vip_price !== undefined
      ? String(Number(eventToEdit.vip_price).toFixed(0))
      : '250'
  );
  const [bannerImage, setBannerImage] = useState(
    eventToEdit?.banner_image || PRESET_POSTERS[0].url
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) {
      setError('Please provide a title for the play or cinema show.');
      return;
    }
    if (!showDate.trim()) {
      setError('Please enter the show date and time (e.g. 2026-12-10 18:00).');
      return;
    }

    setLoading(true);
    const payload = {
      title: title.trim(),
      venue,
      show_date: showDate.trim(),
      pricing_type: pricingType,
      regular_price: pricingType === 'paid' ? Number(regularPrice || 150) : 0,
      vip_price: pricingType === 'paid' ? Number(vipPrice || 250) : 0,
      banner_image: bannerImage.trim() || PRESET_POSTERS[0].url,
    };

    const res = isEditing
      ? await updateAdminEvent(eventToEdit.id, payload)
      : await createAdminEvent(payload);

    setLoading(false);

    if (res && res.success) {
      onSaved(res.event, res.message);
    } else {
      setError(res?.message || 'Could not save show details.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Campus Tagline Banner */}
        <View style={styles.taglineBanner}>
          <Text style={styles.taglineBannerText}>
            MSEUF CAMPUS THEATER ADMIN & PLAY PUBLISHER • POST SHOWS FOR STUDENT MOBILE APP
          </Text>
        </View>

        <View style={styles.mainPadding}>
          {/* Top Breadcrumb & Page Header (Matches create.blade.php / edit.blade.php) */}
          <View style={styles.headerBlock}>
            <View style={styles.breadcrumbRow}>
              <TouchableOpacity onPress={onCancel}>
                <Text style={styles.breadcrumbLink}>Shows & Plays</Text>
              </TouchableOpacity>
              <Text style={styles.breadcrumbSep}>›</Text>
              {isEditing && (
                <>
                  <Text style={styles.breadcrumbLink} numberOfLines={1}>
                    {eventToEdit.title}
                  </Text>
                  <Text style={styles.breadcrumbSep}>›</Text>
                </>
              )}
              <Text style={styles.breadcrumbCurrent}>
                {isEditing ? 'Edit Show' : 'Post New Show'}
              </Text>
            </View>

            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pageTitle}>
                  {isEditing
                    ? 'Edit Campus Play / Cine Show'
                    : 'Post Campus Play or Cine Show'}
                </Text>
                <Text style={styles.pageSubtitle}>
                  {isEditing
                    ? 'Updating these details will immediately sync with the student mobile app.'
                    : 'Fill in the details below. Once posted, this event will be immediately visible for students to book on the mobile app.'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.backBtn}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.backBtnText}>
                  ← {isEditing ? 'View Event Overview' : 'Back to Catalog'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>
                Please fix the following errors:
              </Text>
              <Text style={styles.errorText}>• {error}</Text>
            </View>
          )}

          {/* ===================================================================== */}
          {/* FORM SECTION CARD (Matches create.blade.php / edit.blade.php)         */}
          {/* ===================================================================== */}
          <View style={styles.formCard}>
            {/* 1. Show Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                SHOW TITLE <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Hiyas ng Enverga 2026: Coronation Night"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* 2. University Venue (Dedicated Little Theater Card) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>VENUE / AUDITORIUM</Text>
              <View style={styles.venueFixedCard}>
                <View style={styles.ltBadge}>
                  <Text style={styles.ltBadgeText}>LT</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.venueFixedTitle}>
                    Little Theater, AEC Building
                  </Text>
                  <Text style={styles.venueFixedSub}>
                    MSEUF Campus • Dedicated 60-Seat Interactive Auditorium
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. Show Date & Time */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                SHOW DATE & TIME <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={showDate}
                onChangeText={setShowDate}
                placeholder="YYYY-MM-DD HH:MM (e.g. 2026-12-10 18:00)"
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.helperText}>
                Specify when students should arrive at the university theater (Format: YYYY-MM-DD HH:MM).
              </Text>
            </View>

            {/* 4. Admission / Pricing Type (Free vs Paid) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                ADMISSION / PRICING TYPE{' '}
                <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.pricingGrid}>
                {/* Paid Option */}
                <TouchableOpacity
                  style={[
                    styles.pricingOptionCard,
                    pricingType === 'paid' && styles.pricingOptionPaidActive,
                  ]}
                  onPress={() => setPricingType('paid')}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      pricingType === 'paid' && styles.radioOuterPaid,
                    ]}
                  >
                    {pricingType === 'paid' && (
                      <View style={styles.radioInnerPaid} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.pricingOptionTitle,
                        pricingType === 'paid' && { color: COLORS.maroonDark },
                      ]}
                    >
                      ★ Paid Admission
                    </Text>
                    <Text style={styles.pricingOptionSub}>
                      Regular & VIP Tier Pricing
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Free Option */}
                <TouchableOpacity
                  style={[
                    styles.pricingOptionCard,
                    pricingType === 'free' && styles.pricingOptionFreeActive,
                  ]}
                  onPress={() => setPricingType('free')}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      pricingType === 'free' && styles.radioOuterFree,
                    ]}
                  >
                    {pricingType === 'free' && (
                      <View style={styles.radioInnerFree} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.pricingOptionTitle,
                        pricingType === 'free' && { color: '#065F46' },
                      ]}
                    >
                      Free Admission
                    </Text>
                    <Text style={styles.pricingOptionSub}>
                      No payment required (₱0.00)
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* 5. Tiered Seat Pricing (Conditional when Paid) */}
            {pricingType === 'paid' && (
              <View style={styles.tieredPricingCard}>
                <View style={styles.tieredPricingHeader}>
                  <Text style={styles.tieredStar}>★</Text>
                  <Text style={styles.tieredPricingTitle}>
                    Tiered Seat Pricing (Auditorium Rows)
                  </Text>
                </View>

                <View style={styles.priceInputsRow}>
                  {/* Regular Seats (Rows C-F) */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.priceFieldLabel}>
                      Regular Seats (Rows C to F) ₱
                    </Text>
                    <View style={styles.currencyInputWrap}>
                      <Text style={styles.currencyPrefix}>₱</Text>
                      <TextInput
                        style={styles.currencyInput}
                        value={regularPrice}
                        onChangeText={setRegularPrice}
                        keyboardType="numeric"
                        placeholder="150"
                        placeholderTextColor={COLORS.textMuted}
                      />
                    </View>
                  </View>

                  {/* VIP Front Rows (Rows A-B) */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vipFieldLabel}>
                      ★ VIP Front Rows (Rows A & B) ₱
                    </Text>
                    <View
                      style={[
                        styles.currencyInputWrap,
                        { borderColor: COLORS.vipBorder },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currencyPrefix,
                          { color: COLORS.vipGold },
                        ]}
                      >
                        ₱
                      </Text>
                      <TextInput
                        style={styles.currencyInput}
                        value={vipPrice}
                        onChangeText={setVipPrice}
                        keyboardType="numeric"
                        placeholder="250"
                        placeholderTextColor={COLORS.textMuted}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* 6. Show Poster / Banner Image Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>SHOW POSTER / BANNER IMAGE</Text>
              <Text style={styles.helperTextBottom}>
                Click any curated theater poster below or paste a custom URL:
              </Text>

              <View style={styles.posterGrid}>
                {PRESET_POSTERS.map((poster) => {
                  const selected = bannerImage === poster.url;
                  return (
                    <TouchableOpacity
                      key={poster.url}
                      style={[
                        styles.posterThumb,
                        selected && styles.posterThumbSelected,
                      ]}
                      onPress={() => setBannerImage(poster.url)}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: poster.url }}
                        style={styles.posterThumbImg}
                        resizeMode="cover"
                      />
                      <View style={styles.posterThumbOverlay}>
                        <Text
                          style={styles.posterThumbTitle}
                          numberOfLines={2}
                        >
                          {poster.title}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.urlInput}
                value={bannerImage}
                onChangeText={setBannerImage}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
              />
            </View>

            {/* Submit & Cancel Footer */}
            <View style={styles.formFooter}>
              <TouchableOpacity onPress={onCancel} style={styles.cancelLinkBtn}>
                <Text style={styles.cancelLinkText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isEditing ? 'SAVE & UPDATE SHOW' : 'PUBLISH SHOW NOW'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ===================================================================== */}
          {/* LIVE MOBILE PREVIEW (Matches Right 5 Cols of create/edit.blade.php)   */}
          {/* ===================================================================== */}
          <View style={styles.previewSection}>
            <View style={styles.previewHeaderRow}>
              <Text style={styles.previewHeaderTitle}>
                STUDENT MOBILE APP LIVE PREVIEW
              </Text>
              <View style={styles.liveSyncBadge}>
                <Text style={styles.liveSyncBadgeText}>
                  {isEditing ? 'Live Sync' : 'Auto-Updates Live'}
                </Text>
              </View>
            </View>

            {/* Phone Mockup Frame */}
            <View style={styles.phoneFrame}>
              <View style={styles.phoneStatusBar}>
                <Text style={styles.phoneStatusText}>9:41</Text>
                <Text style={styles.phoneStatusText}>5G • 100%</Text>
              </View>

              <View style={styles.replicaCard}>
                <View style={styles.replicaBannerWrap}>
                  <Image
                    source={{
                      uri: bannerImage || PRESET_POSTERS[0].url,
                    }}
                    style={styles.replicaBannerImg}
                    resizeMode="cover"
                  />
                  <View style={styles.replicaBannerOverlay} />
                  <View style={styles.replicaBadgePos}>
                    {pricingType === 'free' ? (
                      <View style={styles.replicaFreeBadge}>
                        <Text style={styles.replicaBadgeText}>
                          FREE ADMISSION
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.replicaPaidBadge}>
                        <Text style={styles.replicaBadgeVip}>
                          VIP ₱{vipPrice || 0}
                        </Text>
                        <Text style={styles.replicaBadgeText}>
                          {' '}
                          • REG ₱{regularPrice || 0}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.replicaBody}>
                  <Text style={styles.replicaTitle} numberOfLines={1}>
                    {title || 'Your Show Title Here'}
                  </Text>

                  <View style={styles.replicaMetaRow}>
                    <Text style={styles.replicaMetaLabel}>Venue:</Text>
                    <Text style={styles.replicaMetaValue} numberOfLines={1}>
                      {venue}
                    </Text>
                  </View>

                  <View style={styles.replicaMetaRow}>
                    <Text style={styles.replicaMetaLabel}>Date:</Text>
                    <Text style={styles.replicaMetaValue}>
                      {showDate ? showDate.replace('T', ' • ') : 'Upcoming Date'}
                    </Text>
                  </View>

                  <View style={styles.replicaCapWrap}>
                    <View style={styles.replicaCapHeader}>
                      <Text style={styles.replicaCapLabel}>
                        Auditorium Capacity
                      </Text>
                      <Text style={styles.replicaCapCount}>60 of 60 open</Text>
                    </View>
                    <View style={styles.replicaCapBar}>
                      <View style={styles.replicaCapFill} />
                    </View>
                  </View>

                  <View style={styles.replicaCta}>
                    <Text style={styles.replicaCtaText}>
                      Select Cinema Seats ›
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.phoneBottomCaption}>Live Mobile Preview</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    gap: 8,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  pageSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  backBtn: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: '#E5E7EB',
  },
  backBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1F2937',
  },
  errorBox: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  errorTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#7F1D1D',
    marginBottom: 3,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 18,
  },
  fieldGroup: {
    gap: 7,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: 0.6,
  },
  requiredStar: {
    color: COLORS.error,
  },
  input: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  helperTextBottom: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  venueFixedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    backgroundColor: COLORS.maroonPale,
    borderWidth: 2,
    borderColor: COLORS.maroonBorder,
    borderRadius: 16,
  },
  ltBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ltBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  venueFixedTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#3D0000',
  },
  venueFixedSub: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.maroon,
    marginTop: 1,
  },
  pricingGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  pricingOptionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  pricingOptionPaidActive: {
    borderColor: COLORS.maroon,
    backgroundColor: COLORS.maroonPale,
  },
  pricingOptionFreeActive: {
    borderColor: COLORS.success,
    backgroundColor: '#ECFDF5',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterPaid: {
    borderColor: COLORS.maroon,
  },
  radioInnerPaid: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.maroon,
  },
  radioOuterFree: {
    borderColor: COLORS.success,
  },
  radioInnerFree: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  pricingOptionTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#374151',
  },
  pricingOptionSub: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  tieredPricingCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: COLORS.vipBorder,
    gap: 12,
  },
  tieredPricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tieredStar: {
    color: COLORS.vipGold,
    fontSize: 15,
    fontWeight: '900',
  },
  tieredPricingTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.maroonDark,
  },
  priceInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 5,
  },
  vipFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.vipGoldDark,
    marginBottom: 5,
  },
  currencyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 11,
    paddingHorizontal: 10,
  },
  currencyPrefix: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  posterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  posterThumb: {
    width: '31%',
    height: 64,
    borderRadius: 11,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  posterThumbSelected: {
    borderColor: COLORS.maroon,
  },
  posterThumbImg: {
    width: '100%',
    height: '100%',
  },
  posterThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  posterThumbTitle: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  urlInput: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 11.5,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  formFooter: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelLinkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  cancelLinkText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  submitBtn: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    backgroundColor: COLORS.maroon,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  previewSection: {
    gap: 10,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#374151',
    letterSpacing: 0.5,
  },
  liveSyncBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveSyncBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  phoneFrame: {
    backgroundColor: '#111827',
    borderRadius: 32,
    padding: 16,
    borderWidth: 4,
    borderColor: '#1F2937',
  },
  phoneStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  phoneStatusText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
  },
  replicaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  replicaBannerWrap: {
    height: 135,
    backgroundColor: '#111827',
    position: 'relative',
  },
  replicaBannerImg: {
    width: '100%',
    height: '100%',
  },
  replicaBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  replicaBadgePos: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  replicaFreeBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  replicaPaidBadge: {
    flexDirection: 'row',
    backgroundColor: COLORS.maroon,
    borderWidth: 1,
    borderColor: COLORS.vipGold,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  replicaBadgeVip: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '900',
  },
  replicaBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
  replicaBody: {
    padding: 14,
    gap: 6,
  },
  replicaTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  replicaMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  replicaMetaLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  replicaMetaValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flex: 1,
  },
  replicaCapWrap: {
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  replicaCapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  replicaCapLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  replicaCapCount: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.maroon,
  },
  replicaCapBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
  },
  replicaCapFill: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.maroon,
  },
  replicaCta: {
    marginTop: 8,
    paddingVertical: 10,
    backgroundColor: COLORS.maroon,
    borderRadius: 11,
    alignItems: 'center',
  },
  replicaCtaText: {
    color: COLORS.white,
    fontSize: 11.5,
    fontWeight: '900',
  },
  phoneBottomCaption: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 10,
    color: '#9CA3AF',
  },
});
