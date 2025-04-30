import type { Metadata } from "next";
import { Center } from "@chakra-ui/react";
import { Poppins } from "next/font/google";
import "./globals.css";
import "react-datepicker/dist/react-datepicker.css";
import '@mysten/dapp-kit/dist/index.css';
import { Toaster } from "@/components/ui/toaster";
import { siteConfig } from "@/config/site";

import Provider from "./provider";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  preload: true,
})

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body className={`${poppins.className}`}>
        <Provider>
          <Toaster />
          <Center overflow={"hidden"} p={"6"} w={"full"} h={"svh"} textStyle={"body"}>
            {children}
          </Center>
        </Provider>
      </body>
    </html>
  );
}
