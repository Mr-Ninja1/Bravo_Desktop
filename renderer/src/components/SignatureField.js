import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image, Dimensions, ScrollView, Platform } from 'react-native';
import Signature from 'react-native-signature-canvas';

export default function SignatureField({ value, onChange, editable = true, height = 140, width = 200, placeholder = 'Sign here', debugMode = false }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const { width: sw, height: sh } = Dimensions.get('window');

  const modalWidth = Math.max(300, Math.min(sw - 40, 1000));
  const modalHeight = Math.max(240, Math.min(Math.round(sh * 0.78), Math.min(sh - 40, 800)));

  const handleOK = (base64Data) => {
    const dataUri = base64Data && base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
    try { onChange && onChange(dataUri); } catch (e) { console.warn('SignatureField: onChange handler threw', e); } finally { setVisible(false); }
  };

  const previewUri = value && (value.startsWith('data:') ? value : `data:image/png;base64,${value}`);

  if (!editable) {
    return previewUri ? <Image source={{ uri: previewUri }} style={{ width, height, resizeMode: 'contain' }} /> : <Text style={{ color: '#666' }}>{placeholder}</Text>;
  }

  const webStyle = `
    .m-signature-pad { box-shadow: none; border: none; }
    html, body { height: 100%; margin: 0; padding: 0; }
    .m-signature-pad--body { height: 100%; }
    .m-signature-pad--body canvas { width: 100% !important; height: 100% !important; touch-action: none; }
    .m-signature-pad--footer { display: none; }
  `;

  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity onPress={() => setVisible(true)} style={[styles.previewWrap, { width, height }]} activeOpacity={0.8}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={{ width: width, height: height, resizeMode: 'contain' }} />
        ) : (
          <Text style={styles.placeholder}>Tap to sign</Text>
        )}
      </TouchableOpacity>
      <Modal visible={visible} transparent={!debugMode} animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={[styles.overlay, debugMode ? styles.overlayDebug : null]}>
            <View style={[styles.modalBox, { width: modalWidth, maxHeight: modalHeight }] }>
              <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{ height: Math.max(200, modalHeight - 120) }}>
                  <Signature
                    ref={ref}
                    onOK={handleOK}
                    descriptionText="Sign above"
                    clearText="Clear"
                    confirmText="Save"
                    webStyle={webStyle}
                    autoClear={false}
                    penColor="#000000"
                    backgroundColor="rgba(255,255,255,1)"
                    minWidth={4}
                    maxWidth={10}
                    dotSize={2}
                    velocityFilterWeight={0.7}
                    height={Math.max(200, modalHeight - 120)}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => setVisible(false)} style={[styles.signBtn, styles.sideBtn, { backgroundColor: '#6b7280' }]}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    try {
                      if (ref.current && typeof ref.current.readSignature === 'function') { ref.current.readSignature(); return; }
                      if (ref.current && typeof ref.current.injectJavaScript === 'function') { const js = "try{(function(){var p=window.signaturePad||window.__signaturePad; if(p&&p.toDataURL){var d=p.toDataURL(); if(window.ReactNativeWebView&&window.ReactNativeWebView.postMessage){window.ReactNativeWebView.postMessage(d);} else if(window.postMessage){window.postMessage(d);}}})();}catch(e){console.error(e);}true;"; ref.current.injectJavaScript(js); return; }
                      if (ref.current && typeof ref.current.postMessage === 'function') { try { ref.current.postMessage('readSignature'); } catch (e) {} return; }
                    } catch (e) { console.warn('SignatureField: Save handler fallback failed', e); }
                    console.warn('SignatureField: signature component not ready for saving');
                    setVisible(false);
                  }}
                  style={[styles.signBtn, styles.saveBtn]}
                ><Text style={styles.btnText}>Save</Text></TouchableOpacity>
              </View>
            </View>
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  previewWrap: { borderWidth: 0, borderColor: 'transparent', padding: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  placeholder: { color: '#9ca3af' },
  signBtn: { backgroundColor: '#185a9d', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, minWidth: 84, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  overlayDebug: { backgroundColor: 'rgba(0,0,0,0.85)' },
  modalBox: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', padding: 8 },
  modalBtns: { padding: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  sideBtn: { marginHorizontal: 8 },
  saveBtn: { marginHorizontal: 12, alignSelf: 'center' },
});
