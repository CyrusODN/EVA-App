import { Platform } from "react-native";

export const fontConfig = {
    displaySmall: {
        fontFamily: Platform.OS === 'ios' ? "GommeSans-Regular" : "GommeSans",
        fontSize: 14,
        fontWeight: "400",
        letterSpacing: 0,
        lineHeight: 16,
    },

    displayMedium: {
        fontFamily: "GommeSans-SemiBold",
        fontSize: 18,
        fontWeight: "400",
        letterSpacing: 0,
        lineHeight: 20,
    },

    displayLarge: {
        fontFamily: "GommeSans-SemiBold",
        fontSize: 22,
        fontWeight: "400",
        letterSpacing: 0,
        lineHeight: 25,
    },
    headlineSmall: {
        fontFamily: Platform.OS === 'ios' ? "GommeSans-Regular" : "GommeSans",
        fontSize: 14,
        fontWeight: "400",
        letterSpacing: 0,
        lineHeight: 18,
    },
    headlineMedium: {
        fontFamily: Platform.OS === 'ios' ? "GommeSans-Regular" : "GommeSans",
        fontSize: 18,
        fontWeight: "400",
        letterSpacing: 0,
        lineHeight: 22,
    },

    headlineLarge: {
        fontFamily: Platform.OS === 'ios' ? "GommeSans-Regular" : "GommeSans",
        fontSize: 25,
        fontWeight: "400",
        letterSpacing: 0,
        lineHeight: 30,
    },
    titleSmall: {
        fontFamily: Platform.OS === 'ios' ? "GommeSans-Regular" : "GommeSans",
        fontSize: 14,
        fontWeight: "400",
        letterSpacing: 0.1,
        lineHeight: 20,
        textTransform: "none",
    },

    titleMedium: {
        fontFamily: Platform.OS === 'ios' ? "GommeSans-Regular" : "GommeSans",
        fontSize: 16,
        fontWeight: "400",
        letterSpacing: 0.15,
        lineHeight: 24,
        textTransform: "none",
    },

    titleLarge: {
        fontFamily: Platform.OS === 'ios' ? "GommeSans-Regular" : "GommeSans",
        fontSize: 22,
        fontWeight: "400",
        letterSpacing: 0,
        lineHeight: 28,
        textTransform: "none",
    },
    labelSmall: {
        fontFamily: Platform.OS === 'ios' ? "GommeSans-Regular" : "GommeSans",
        fontSize: 11,
        fontWeight: "500",
        letterSpacing: 0.5,
        lineHeight: 16,
    },

    labelMedium: {
        fontFamily: Platform.OS === 'ios' ? "GommeSans-Regular" : "GommeSans",
        fontSize: 12,
        fontWeight: "500",
        letterSpacing: 0.5,
        lineHeight: 16,
    },

    labelLarge: {
        fontFamily: Platform.OS === 'ios' ? "GommeSans-Regular" : "GommeSans",
        fontSize: 14,
        fontWeight: "500",
        letterSpacing: 0.1,
        lineHeight: 20,
    },
    bodySmall: {
        fontFamily: "GommeSans-SemiBold",
        fontSize: 14,
        fontWeight: "400",
        letterSpacing: 0.4,
        lineHeight: 16,
    },

    bodyMedium: {
        fontFamily: "GommeSans-SemiBold",
        fontSize: 16,
        fontWeight: "400",
        letterSpacing: 0.25,
        lineHeight: 20,
    },

    bodyLarge: {
        fontFamily: "GommeSans-SemiBold",
        fontSize: 18,
        fontWeight: "400",
        letterSpacing: 0.15,
        lineHeight: 24,
    },

};