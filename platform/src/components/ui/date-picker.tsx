import { forwardRef } from "react";
import { Input, InputProps, Icon } from "@chakra-ui/react"; // Thêm Icon nếu muốn

interface DatePickerInputProps extends InputProps {
    value?: string;
    onClick?: () => void;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
export const DatePickerInput = forwardRef<HTMLInputElement, DatePickerInputProps>(
    ({ value, onClick, onChange, ...props }, ref) => (
        <Input
            value={value}
            ref={ref}
            size="sm"
            w={"full"}
            _placeholder={{ color: "fg.contrast" }}
            variant="subtle"
            bg={"bg.300"}
            rounded={"lg"}
            autoComplete="on"
            placeholder="Date picker"
            onClick={onClick}
            onChange={onChange}
            {...props}
        />
    )
);


DatePickerInput.displayName = "DatePickerInput";