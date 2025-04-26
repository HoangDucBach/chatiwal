import { createSystem, defaultConfig, defineConfig, defineSemanticTokens, defineTextStyles, defineTokens } from "@chakra-ui/react"

const tokens = defineTokens({
    colors: {
        danger: { value: "{colors.red}" },
        bg: {
            DEFAULT: { value: "#151613" },
        },
        fg: {
            DEFAULT: { value: "#FFFFFF" },
            50: { value: "#151515" },
            100: { value: "#1A1A1A" },
            200: { value: "#242424" },
            300: { value: "#2E2E2E" },
            400: { value: "#383838" },
            500: { value: "#474747" },
            600: { value: "#606060" },
            700: { value: "#707070" },
            800: { value: "#828282" },
            900: { value: "#949494" },
        },
        default: {
            DEFAULT: { value: "#FFFFFF" },
            50: { value: "#242324" },
            100: { value: "#3A3A3C" },
            200: { value: "#4E4E50" },
            300: { value: "#636365" },
            400: { value: "#7A7A7C" },
            500: { value: "#919193" },
            600: { value: "#A8A8AA" },
            700: { value: "#C0C0C2" },
            800: { value: "#D8D8DA" },
            900: { value: "#FFFFFF" }
        },
        primary: {
            DEFAULT: { value: "#6EDFE7" },
            fg: { value: "#08525E" },
            50: { value: "#041519" },
            100: { value: "#0B323D" },
            200: { value: "#185560" },
            300: { value: "#297F89" },
            400: { value: "#3CA8B4" },
            500: { value: "#6EDFE7" },
            600: { value: "#56D3E1" },
            700: { value: "#8AE1EB" },
            800: { value: "#BEEFF5" },
            900: { value: "#F2FDFF" },
        },
        secondary: {
            DEFAULT: { value: "#89EAC6" },
            fg: { value: "#065646" },
            50: { value: "#030F0E" },
            100: { value: "#0C2D2B" },
            200: { value: "#185249" },
            300: { value: "#2C7F6A" },
            400: { value: "#42AD8C" },
            500: { value: "#89EAC6" },
            600: { value: "#89EAC6" },
            700: { value: "#AEEBF2" },
            800: { value: "#BBF4DF" },
            900: { value: "#F1FFFA" },
        }
    }
})
const semanticTokens = defineSemanticTokens({
    colors: {
        danger: { value: "{colors.red}" },
        bg: {
            DEFAULT: { value: "#191A1C" },
            50: { value: "#1A1A1A" },
            100: { value: "#191A1C" },
            200: { value: "#242527" },
            300: { value: "#383838" },
            400: { value: "#545255" },
            500: { value: "#6A6967" },
            600: { value: "#807E7C" },
            700: { value: "#969492" },
            800: { value: "#ACAAA8" },
            900: { value: "#C2C0BE" }
        },
        fg: {
            DEFAULT: { value: "#FFFFFF" },
            50: { value: "#151515" },
            100: { value: "#1A1A1A" },
            200: { value: "#242424" },
            300: { value: "#2E2E2E" },
            400: { value: "#383838" },
            500: { value: "#474747" },
            600: { value: "#606060" },
            700: { value: "#707070" },
            800: { value: "#828282" },
            900: { value: "#949494" },
        },
        default: {
            solid: { value: "{colors.default.100}" },
            contrast: { value: "{colors.default.900}" },
            fg: { value: "{colors.default.800}" },
            muted: { value: "{colors.default.300}" },
            subtle: { value: "{colors.default.200}" },
            emphasized: { value: "{colors.default.400}" },
            focusRing: { value: "{colors.default.600}" }
        },
        primary: {
            // solid: { value: "{colors.primary.500}" },
            // contrast: { value: "{colors.primary.100}" },
            // fg: { value: "#08525E" },
            // muted: { value: "{colors.primary.300}" },
            // subtle: { value: "{colors.primary.400}" },
            // emphasized: { value: "{colors.primary.700}" },
            // focusRing: { value: "{colors.primary.500}" },
            solid: { value: "{colors.primary.500}" },
            contrast: { value: "{colors.primary.900}" },
            fg: { value: "{colors.primary.800}" },
            muted: { value: "{colors.primary.300}" },
            subtle: { value: "{colors.primary.200}" },
            emphasized: { value: "{colors.primary.400}" },
            focusRing: { value: "{colors.primary.600}" }
        },
        secondary: {
            solid: { value: "{colors.secondary.500}" },
            contrast: { value: "{colors.secondary.100}" },
            fg: { value: "{colors.secondary.700}" },
            muted: { value: "{colors.secondary.100}" },
            subtle: { value: "{colors.secondary.200}" },
            emphasized: { value: "{colors.secondary.300}" },
            focusRing: { value: "{colors.secondary.500}" },
        }
    },
    shadows: {
        custom: {
            xs: {

            },
            sm: {
                value: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",
            },
            md: {
                value: "0 16px 32px 0 rgba(0, 0, 0, 0.5)",
            },
            lg: {
                value: "0 32px 56px 0 rgba(0, 0, 0, 0.5)",
            },
            xl: {
                value: "0 64px 128px 0 rgba(0, 0, 0, 0.5)",
            },
            "2xl": {
                value: "0 128px 256px 0 rgba(0, 0, 0, 0.5)",
            },
        }
    }
})

const textStyles = defineTextStyles({
    body: {
        value: {
            fontFamily: "Poppins"
        }
    }
})
const config = defineConfig({
    theme: {
        tokens,
        semanticTokens,
        textStyles
    },
    globalCss: {
        body: {
            bg: "bg",
        },
    }
})

export default createSystem(defaultConfig, config)