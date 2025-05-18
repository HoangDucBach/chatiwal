"use client"

import { Box, chakra } from "@chakra-ui/react";
import NextImage from "next/image";
import { initParticlesEngine, Particles } from "@tsparticles/react";
import { Container, Engine } from "@tsparticles/engine";
import { useCallback, useEffect, useState } from "react";
import { loadSlim } from "@tsparticles/slim";
export default function BackgroundParticles() {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = useCallback(async (container: Container | undefined) => {
        console.log(container);
    }, []);

    return (
        <>
            {init && (
                <Particles
                    id="tsparticles"
                    particlesLoaded={particlesLoaded}
                    options={{
                        fpsLimit: 160,
                        interactivity: {
                            events: {
                                onClick: {
                                    enable: true,
                                    mode: "push",
                                },
                                onHover: {
                                    enable: true,
                                    mode: "repulse",
                                },
                                resize: {
                                    enable: true,
                                    delay: 0.5,
                                },
                            },
                            modes: {
                                push: {
                                    quantity: 4,
                                },
                                repulse: {
                                    distance: 200,
                                    duration: 0.4,
                                },
                            },
                        },
                        particles: {
                            color: {
                                value: "#ffffff",
                            },
                            move: {
                                direction: "top",
                                enable: true,
                                outModes: {
                                    default: "bounce",
                                },
                                random: true,
                                speed: 6,
                                straight: false,
                            },
                            number: {
                                density: {
                                    enable: true,
                                },
                                value: 28,
                            },
                            opacity: {
                                value: { min: 0.3, max: 1 },
                                animation: {
                                    sync: false,
                                    enable: true,
                                    delay: 5000
                                }
                            },
                            shape: {
                                type: "circle",
                            },
                            size: {
                                value: { min: 1, max: 3 },
                            },
                        },
                        detectRetina: true,
                    }}
                />
            )}
        </>
    );
}
export function Effects() {
    return (
        <chakra.div pos={"absolute"} zIndex={"-1"} top={"0"} left={"0"} w={"svw"} h={"svh"} pointerEvents={"none"}>
            <NextImage
                style={{
                    pointerEvents: "none",
                }}
                src={"/assets/effect-radial-gradient.png"}
                alt={"radial-gradient"}
                priority
                fill
            />
            <BackgroundParticles />
        </chakra.div>
    );
}