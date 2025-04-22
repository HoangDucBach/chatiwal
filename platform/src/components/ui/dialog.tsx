import { Box, Dialog as ChakraDialog, Portal } from "@chakra-ui/react"
import { CloseButton } from "./close-button"
import * as React from "react"

interface DialogContentProps extends ChakraDialog.ContentProps {
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement>
  backdrop?: boolean
}

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  DialogContentProps
>(function DialogContent(props, ref) {
  const {
    children,
    portalled = true,
    portalRef,
    backdrop = true,
    ...rest
  } = props

  return (
    <Portal disabled={!portalled} container={portalRef}>
      {backdrop && <ChakraDialog.Backdrop />}
      <ChakraDialog.Positioner>
        <ChakraDialog.Content bg={"fg.100"} rounded="3xl" border={"none"} outlineStyle={"solid"} outlineColor={"bg"} outlineWidth={"16px"} overflow={"hidden"} ref={ref} {...rest} asChild={false}>
          <Box
            position="absolute"
            width="32"
            height="32"
            bg={"primary"}
            rounded={"full"}
            top={"0"}
            left={"50%"}
            filter={"blur(64px)"}
            transform={"translateX(-50%) translateY(-50%)"}
            pointerEvents={"none"}
          />
          <Box
            position="absolute"
            width="16"
            height="16"
            bg={"primary"}
            rounded={"full"}
            top={"0"}
            left={"50%"}
            filter={"blur(32px)"}
            transform={"translateX(-50%) translateY(-50%)"}
            pointerEvents={"none"}
          />
          {children}
        </ChakraDialog.Content>
      </ChakraDialog.Positioner>
    </Portal>
  )
})

export const DialogCloseTrigger = React.forwardRef<
  HTMLButtonElement,
  ChakraDialog.CloseTriggerProps
>(function DialogCloseTrigger(props, ref) {
  return (
    <ChakraDialog.CloseTrigger
      position="absolute"
      top="2"
      insetEnd="2"
      {...props}
      asChild
    >
      <CloseButton size="sm" ref={ref}>
        {props.children}
      </CloseButton>
    </ChakraDialog.CloseTrigger>
  )
})

export const DialogRoot = ChakraDialog.Root
export const DialogFooter = ChakraDialog.Footer
export const DialogHeader = ChakraDialog.Header
export const DialogBody = ChakraDialog.Body
export const DialogBackdrop = ChakraDialog.Backdrop
export const DialogTitle = ChakraDialog.Title
export const DialogDescription = ChakraDialog.Description
export const DialogTrigger = ChakraDialog.Trigger
export const DialogActionTrigger = ChakraDialog.ActionTrigger
