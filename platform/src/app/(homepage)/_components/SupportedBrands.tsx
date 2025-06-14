import { HStack, StackProps, Text } from "@chakra-ui/react";
import NextImage from "next/image";
import { Image } from "@chakra-ui/react";

interface Props extends StackProps { }

export function SupportedBrands({ ...props }: Props) {
    const supportedBrands = [
        {
            label: "Sui",
            icon: "/logo-sui.png",
        },
        {
            label: "Walrus",
            icon: "/logo-walrus.png",
        },
        {
            label: "Seal",
            icon: "/logo-seal.png",
        }
    ];

    return (
        <HStack gap={"8"}>
            {supportedBrands.map((brand, index) => (
                <HStack
                    key={index}
                    {...props}
                >
                    <Image
                        borderRadius="lg"
                        asChild
                    >
                        <NextImage
                            src={brand.icon}
                            alt={brand.label}
                            width={32}
                            height={32}
                            style={{
                                objectFit: "contain",
                                filter: "grayscale(100%)"
                            }}
                        />
                    </Image>
                    <Text
                        fontSize="md"
                        color="fg.900"
                        fontWeight="medium"
                        textTransform="capitalize"
                    >
                        {brand.label}
                    </Text>
                </HStack>
            ))}
        </HStack>
    );
}