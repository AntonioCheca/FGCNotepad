import TextField from '@mui/material/TextField';

const InputField = ({ label, type, name, register, errors }) => {
    return (
        <TextField
            label={label}
            type={type}
            {...register(name)}
            fullWidth
            error={!!errors[name]}
            helperText={errors[name]?.message}
            margin="normal"
        />
    );
};

export default InputField;
