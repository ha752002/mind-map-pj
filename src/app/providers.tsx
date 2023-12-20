"use client";

import * as React from "react";
import {useRouter} from 'next/navigation'
import {ReactFlowProvider} from "reactflow";
import 'reactflow/dist/style.css';
import {ReactNode} from "react";


export function Providers({children}: { children: ReactNode }) {
    const router = useRouter();

    return (
        <ReactFlowProvider>
            {children}
        </ReactFlowProvider>
    );
}
