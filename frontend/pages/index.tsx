import type {GetServerSideProps} from "next";

export default function IndexPage() {
    return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
    redirect: {
        destination: "/combos",
        permanent: false,
    },
});
