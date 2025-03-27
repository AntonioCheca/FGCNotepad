import {AppTextField} from "@/src/components/ui/AppTextField";

const InputField = ({label, type, name, register, errors}) => {
    return (
        <AppTextField
            label={label}
            type={type}
            {...register(name)}
            error={!!errors[name]}
            helperText={errors[name]?.message}
        />
    );
};

export default InputField;
