import {AppTextField} from "@/src/components/ui/AppTextField";
import type {FieldErrors, FieldValues, Path, UseFormRegister} from "react-hook-form";

interface InputFieldProps<T extends FieldValues> {
    label: string;
    type: string;
    name: Path<T>;
    register: UseFormRegister<T>;
    errors: FieldErrors<T>;
}

const InputField = <T extends FieldValues>({label, type, name, register, errors}: InputFieldProps<T>) => {
    const error = errors[name];

    return (
        <AppTextField
            label={label}
            type={type}
            {...register(name)}
            error={!!error}
            helperText={typeof error?.message === "string" ? error.message : undefined}
        />
    );
};

export default InputField;
