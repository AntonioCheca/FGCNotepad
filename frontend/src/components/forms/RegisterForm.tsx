import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import useAuth from '@/hooks/useAuth';
import {useContext, useState} from 'react';
import InputField from './InputField';
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppBox} from "@/src/components/ui/AppBox";
import AuthContext from "@/services/AuthContext";
import {AuthUser} from "@/src/types/auth";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {TextLink} from "@/src/components/ui/TextLink";

interface RegisterFormData {
    username: string;
    password: string;
    inviteCode: string;
    acceptTerms: boolean;
}

const schema = yup.object().shape({
    username: yup.string().min(4, 'Username must be at least 4 characters').required('Username is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    inviteCode: yup.string().required('Invite code is required'),
    acceptTerms: yup.boolean().required().oneOf([true], 'You must be at least 16 and accept the Terms of Use'),
});

const RegisterForm = () => {
    const {registerUser, loginUser} = useAuth();
    const authContext = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {login} = authContext;

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<RegisterFormData>({resolver: yupResolver(schema), defaultValues: {acceptTerms: false}});
    const {ref: acceptTermsRef, ...acceptTermsField} = register("acceptTerms");

    const onSubmit = async (data: RegisterFormData) => {
        setLoading(true);
        setMessage('');

        try {
            await registerUser(data.username, data.password, data.inviteCode, data.acceptTerms);
            const loginData = await loginUser(data.username, data.password);
            const user = loginData?.user as AuthUser | undefined;
            const csrfToken = loginData?.csrfToken;

            if (!user || typeof csrfToken !== "string" || csrfToken.length === 0) {
                throw new Error("Registration succeeded, but login failed. Please use the login page.");
            }

            login(user, csrfToken, "/combos");
        } catch (error) {
            const normalizedError = error as {response?: {data?: {message?: string; error?: string}}; message?: string};
            setMessage(normalizedError.response?.data?.message || normalizedError.response?.data?.error || normalizedError.message || 'Registration failed');
        }

        setLoading(false);
    };

    return (
        <AppBox component="form" onSubmit={handleSubmit(onSubmit)} sx={{display: "grid", gap: 1}}>
            <InputField label="Username" type="username" name="username" register={register} errors={errors}/>
            <InputField label="Password" type="password" name="password" register={register} errors={errors}/>
            <InputField label="Invite code" type="text" name="inviteCode" register={register} errors={errors}/>
            <AppFormControlLabel
                control={<AppCheckbox inputRef={acceptTermsRef} {...acceptTermsField}/>}
                label="I am at least 16 and I accept the Terms of Use"
                sx={{minHeight: 44}}
            />
            {errors.acceptTerms ? <AppAlert severity="error">{errors.acceptTerms.message}</AppAlert> : null}
            <AppTypography variant="body2" color="text.secondary">
                Antonio Checa processes your account data to run the site and moderate contributions. You can access or delete
                it at any time.
            </AppTypography>
            <AppBox sx={{display: "flex", flexWrap: "wrap", columnGap: 2, "& a": {display: "inline-flex", alignItems: "center", minHeight: 44}}}>
                <TextLink href="/terms">Terms of Use</TextLink>
                <TextLink href="/privacy">Privacy Policy</TextLink>
            </AppBox>
            {message ? <AppAlert severity="error">{message}</AppAlert> : null}
            <AppButton disabled={loading} fullWidth sx={{minHeight: 44}}>
                {loading ? 'Registering...' : 'Register'}
            </AppButton>
        </AppBox>
    );
};

export default RegisterForm;
