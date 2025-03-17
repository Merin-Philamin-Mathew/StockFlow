import { lazy, Suspense } from 'react';
import Loader from '@components/utils/Loader';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ProductListingPage = lazy(() => import('@/pages/Products/ProductListingPage'));
const ProductFormPage = lazy(() => import('@/pages/Products/ProductCreationPage'));
const StockManagementPage = lazy(() => import('@/pages/Products/StockManagementPage'));

const siteRoutes = [
    {
        path: "/",
        element: (
            <Suspense fallback={<Loader/>}>
                <LoginPage/>
            </Suspense>
        ),
    },
    {
        path: "/products",
        element: (
            <Suspense fallback={<Loader/>}>
                <ProductListingPage/>
            </Suspense>
        ),
    },
    {
        path: "/products/new",
        element: (
            <Suspense fallback={<Loader/>}>
                <ProductFormPage/>
            </Suspense>
        ),
    },
    {
        path: "/stock",
        element: (
            <Suspense fallback={<Loader/>}>
                <StockManagementPage/>
            </Suspense>
        ),
    },
];

export default siteRoutes;