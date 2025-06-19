import RegisterForm from '@/src/components/forms/RegisterForm';
import AuthLayout from '@/src/components/layouts/AuthLayout';

const RegisterPage = () => {
    return (
        <AuthLayout title="Register">
            <RegisterForm/>
        </AuthLayout>
    );
};

export default RegisterPage;
