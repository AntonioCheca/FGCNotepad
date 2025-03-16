import RegisterForm from '@/src/toolbar-components/forms/RegisterForm';
import AuthLayout from '@/src/toolbar-components/layouts/AuthLayout';

const RegisterPage = () => {
    return (
        <AuthLayout title="Register">
            <RegisterForm/>
        </AuthLayout>
    );
};

export default RegisterPage;
