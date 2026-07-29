// Shared PIN entry used by the login screen and onboarding.
//
// Design note: this renders ONE real TextInput stretched invisibly across a row
// of display boxes, rather than one TextInput per box.
//
// Why: with one input per box you have to juggle focus refs by hand, and iOS
// fights you — `secureTextEntry` + `maxLength={1}` clears fields on refocus, and
// auto-advance breaks when a box already holds a digit. With a single input the
// value is just a string, so digits fill left to right on their own, backspace
// works, and the "cursor" is simply the box at index === value.length.

import React, { useRef } from "react";
import { View, Text, TextInput, Pressable, StyleProp, ViewStyle } from "react-native";

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Number of digits. Defaults to 6. */
  length?: number;
  /** Render dots instead of digits. */
  masked?: boolean;
  autoFocus?: boolean;
  /** Border colour of the box awaiting the next digit. */
  activeColor?: string;
  /** Border/background tint of boxes that already hold a digit. */
  filledColor?: string;
  boxBackground?: string;
  borderColor?: string;
  textColor?: string;
  boxHeight?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function PinInput({
  value,
  onChange,
  length = 6,
  masked = false,
  autoFocus = false,
  activeColor = "#10B981",
  filledColor = "#10B981",
  boxBackground = "rgba(255,255,255,0.05)",
  borderColor = "rgba(255,255,255,0.08)",
  textColor = "#fff",
  boxHeight = 52,
  style,
  testID,
}: PinInputProps) {
  const inputRef = useRef<TextInput>(null);

  const handleChange = (raw: string) => {
    onChange(raw.replace(/[^0-9]/g, "").slice(0, length));
  };

  const focus = () => inputRef.current?.focus();

  return (
    // Pressable is a fallback: the transparent input on top normally receives the
    // tap itself, but if anything above it swallows the touch we still focus.
    <Pressable onPress={focus} style={style} testID={testID}>
      <View style={{ position: "relative" }}>
        <View
          pointerEvents="none"
          style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}
        >
          {Array.from({ length }).map((_, index) => {
            const filled = Boolean(value[index]);
            const isNext = index === value.length;
            return (
              <View
                key={`pin-box-${index}`}
                style={{
                  flex: 1,
                  height: boxHeight,
                  borderRadius: 12,
                  backgroundColor: filled ? `${filledColor}26` : boxBackground,
                  borderWidth: 2,
                  borderColor: isNext ? activeColor : filled ? `${filledColor}4D` : borderColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: "700", color: textColor }}>
                  {filled ? (masked ? "•" : value[index]) : ""}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Invisible input covering the boxes. Needs explicit insets — "absolute"
            with only width/height would sit at its static position, not on top. */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={length}
          autoFocus={autoFocus}
          caretHidden
          autoCorrect={false}
          autoComplete="off"
          textContentType="oneTimeCode"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.02,
            color: "transparent",
            fontSize: 22,
            textAlign: "center",
          }}
        />
      </View>
    </Pressable>
  );
}

export default PinInput;
