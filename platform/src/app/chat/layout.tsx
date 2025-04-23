import { Provider } from "./provider";

export default function Layout({
    children,
}: React.PropsWithChildren) {
    return (
        <Provider>
            {children}
        </Provider>
    )
}