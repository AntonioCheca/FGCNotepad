import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { registerUser } from '@/services/api';
import { useState } from 'react';
import InputField from './InputField';
import { Button } from '@mui/material';

const schema = yup.object().shape({
    username: yup.string().min(4, 'Username must be at least 4 characters').required('Username is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const RegisterForm = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: yupResolver(schema) });

    const onSubmit = async (data) => {
        setLoading(true);
        setMessage('');

        try {
            await registerUser(data.username, data.password);
            setMessage('Registration successful!');
        } catch (error) {
            setMessage(error.message || 'Registration failed');
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <InputField label="Username" type="username" name="username" register={register} errors={errors} />
            <InputField label="Password" type="password" name="password" register={register} errors={errors} />
            {message && <p>{message}</p>}
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
            </Button>
        </form>
    );
};

export default RegisterForm;
