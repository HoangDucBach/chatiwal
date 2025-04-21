import type { Metadata } from "next";
import { VStack } from "@chakra-ui/react";
import { Poppins } from "next/font/google";
import "./globals.css";
import '@mysten/dapp-kit/dist/index.css';
import { Header } from "@/components/global/header";
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
          <VStack p={"6"} w={"full"} h={"svh"} textStyle={"body"}>
            <Header />
            {children}
          </VStack>
        </Provider>
      </body>
    </html>
  );
}
