import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import useAuth from '@/hooks/useAuth';
import {useState} from 'react';
import InputField from './InputField';
import {AppButton} from "@/src/components/ui/AppButton";

interface RegisterFormData {
    username: string;
    password: string;
    inviteCode: string;
}

const schema = yup.object().shape({
    username: yup.string().min(4, 'Username must be at least 4 characters').required('Username is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    inviteCode: yup.string().required('Invite code is required'),
});

const RegisterForm = () => {
    const {registerUser} = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<RegisterFormData>({resolver: yupResolver(schema)});

    const onSubmit = async (data: RegisterFormData) => {
        setLoading(true);
        setMessage('');

        try {
            await registerUser(data.username, data.password, data.inviteCode);
            setMessage('Registration successful!');
        } catch (error) {
            const normalizedError = error as {response?: {data?: {message?: string; error?: string}}; message?: string};
            setMessage(normalizedError.response?.data?.message || normalizedError.response?.data?.error || normalizedError.message || 'Registration failed');
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <InputField label="Username" type="username" name="username" register={register} errors={errors}/>
            <InputField label="Password" type="password" name="password" register={register} errors={errors}/>
            <InputField label="Invite code" type="text" name="inviteCode" register={register} errors={errors}/>
            {message && <p>{message}</p>}
            <AppButton disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
            </AppButton>
        </form>
    );
};

export default RegisterForm;
