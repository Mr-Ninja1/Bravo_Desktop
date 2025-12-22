import React from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Text, Keyboard, View } from 'react-native';
import PropTypes from 'prop-types';

export default function EditableFormContainer({ children, editMode, setEditMode, onSaveDraft, actionButtons }) {
  const isEditing = editMode;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={{ flex: 1 }} pointerEvents={isEditing ? 'auto' : 'box-none'}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {actionButtons ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 18, alignItems: 'center', zIndex: 250 }}>
          {actionButtons}
        </View>
      ) : null}

      <TouchableOpacity
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isEditing ? 'Finish editing form' : 'Edit form'}
        style={{
          position: 'absolute',
          right: 14,
          top: '50%',
          marginTop: -36,
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: isEditing ? '#34C759' : '#FF3B30',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          overflow: 'hidden',
        }}
        onPress={() => {
          if (isEditing) {
            Keyboard.dismiss();
          }
          setEditMode(!isEditing);
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{isEditing ? 'Done' : 'Edit'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

EditableFormContainer.propTypes = {
  children: PropTypes.node,
  editMode: PropTypes.bool.isRequired,
  setEditMode: PropTypes.func.isRequired,
  onSaveDraft: PropTypes.func,
  actionButtons: PropTypes.node,
};
