"use client";

import type { ButtonProps as ChakraButtonProps, RecipeVariantProps } from "@chakra-ui/react"
import {
  AbsoluteCenter,
  Button as ChakraButton,
  defineRecipe,
  Span,
  Spinner,
  useRecipe,
} from "@chakra-ui/react"
import * as React from "react"

interface ButtonLoadingProps {
  loading?: boolean
  loadingText?: React.ReactNode
}

export const buttonRecipe = defineRecipe({
  base: {
    width: "fit",
    rounded: "full",
  },
})

interface ButtonRecipeProps extends RecipeVariantProps<typeof buttonRecipe> { }
export interface ButtonProps extends ChakraButtonProps, ButtonLoadingProps, ButtonRecipeProps { }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const { loading, disabled, loadingText, children, ...rest } = props
    const recipe = useRecipe({ recipe: buttonRecipe })
    const styles = recipe({})

    return (
      <ChakraButton disabled={loading || disabled} ref={ref} css={styles} {...rest}>
        {loading && !loadingText ? (
          <>
            <AbsoluteCenter display="inline-flex">
              <Spinner size="inherit" color="inherit" />
            </AbsoluteCenter>
            <Span opacity={0}>{children}</Span>
          </>
        ) : loading && loadingText ? (
          <>
            <Spinner size="inherit" color="inherit" />
            {loadingText}
          </>
        ) : (
          children
        )}
      </ChakraButton>
    )
  },
)
