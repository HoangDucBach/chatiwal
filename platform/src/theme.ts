import { createSystem, defaultConfig, defineConfig, defineSemanticTokens, defineTextStyles, defineTokens } from "@chakra-ui/react"

const tokens = defineTokens({
    colors: {
        danger: { value: "{colors.red}" },
        bg: {
            DEFAULT: { value: "#050505" },
            50: { value: "#0F0F0F" },
            100: { value: "#161616" },
            200: { value: "#1C1C1C" },
            300: { value: "#2E2E2E" },
            400: { value: "#474747" },
            500: { value: "#656565" },
            600: { value: "#9C9C9C" },
            700: { value: "#CCCCCC" },
            800: { value: "#EFEFEF" },
            900: { value: "#FFFFFF" }
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
            DEFAULT: { value: "#97FDEA" },
            fg: { value: "#001F2D" },
            50: { value: "#08141D" },
            100: { value: "#283E44" },
            200: { value: "#568484" },
            300: { value: "#77BFB6" },
            400: { value: "#8DEADA" },
            500: { value: "#97FDEA" },
            600: { value: "#A5FBEB" },
            700: { value: "#BFFBF0" },
            800: { value: "#D1FCF4" },
            900: { value: "#DCFDF7" },

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
    },
})
const semanticTokens = defineSemanticTokens({
    colors: {
        danger: { value: "{colors.red}" },
        bg: {
            DEFAULT: { value: "#050505" },
            50: { value: "#0F0F0F" },
            100: { value: "#161616" },
            200: { value: "#1C1C1C" },
            300: { value: "#2E2E2E" },
            400: { value: "#474747" },
            500: { value: "#656565" },
            600: { value: "#9C9C9C" },
            700: { value: "#CCCCCC" },
            800: { value: "#EFEFEF" },
            900: { value: "#FFFFFF" }
        },
        fg: {
            solid: { value: "{colors.fg.100}" },
            contrast: { value: "{colors.fg.900}" },
            fg: { value: "{colors.fg.800}" },
            muted: { value: "{colors.fg.300}" },
            subtle: { value: "{colors.fg.200}" },
            emphasized: { value: "{colors.fg.400}" },
            focusRing: { value: "{colors.fg.600}" }
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
            solid: { value: "{colors.primary.500}" },
            contrast: { value: "{colors.primary.50}" },
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
                value: "0 0px 4px 0 rgba(0, 0, 0, 0.25)",
            },
            sm: {
                value: "0 2px 8px 0 rgba(0, 0, 0, 0.25)",
            },
            md: {
                value: "0 4px 16px 0 rgba(0, 0, 0, 0.25)",
            },
            lg: {
                value: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
            },
            xl: {
                value: "0 16px 64px 0 rgba(0, 0, 0, 0.5)",
            },
            "2xl": {
                value: "0 64px 128px 0 rgba(0, 0, 0, 0.5)",
            },
        }
    },
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