'use client'
import {useCallback, useRef} from 'react';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls, MiniMap,
    Node,
    NodeOrigin,
    OnConnectEnd,
    OnConnectStart,
    Panel,
    useReactFlow,
    useStoreApi,
} from 'reactflow';
import shallow from 'zustand/shallow';

import useStore, {RFState} from '@/state-store/store';

// we need to import the React Flow styles to make it work
import 'reactflow/dist/style.css';
import MindMapNode from "@/components/mind-map-node";
import MindMapEdge from "@/components/mind-map-edge";

const selector = (state: RFState) => ({
    nodes: state.nodes,
    edges: state.edges,
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    addChildNode: state.addChildNode,
});

const nodeTypes = {
    mindMap: MindMapNode,
};

const edgeTypes = {
    mindMap: MindMapEdge,
};

const nodeOrigin: NodeOrigin = [0.5, 0.5];

const connectionLineStyle = { stroke: '#2ecc71', strokeWidth: 1 };
const defaultEdgeOptions = { style: connectionLineStyle, type: 'mindMap' };

function Flow() {
    const store = useStoreApi();
    const { nodes, edges, onNodesChange, onEdgesChange, addChildNode } = useStore(
        selector,
        shallow
    );
    const { project } = useReactFlow();
    const connectingNodeId = useRef<string | null>(null);

    const getChildNodePosition = (event: MouseEvent, parentNode?: Node) => {
        const { domNode } = store.getState();

        if (
            !domNode ||
            // we need to check if these properites exist, because when a node is not initialized yet,
            // it doesn't have a positionAbsolute nor a width or height
            !parentNode?.positionAbsolute ||
            !parentNode?.width ||
            !parentNode?.height
        ) {
            return;
        }

        const { top, left } = domNode.getBoundingClientRect();

        // we need to remove the wrapper bounds, in order to get the correct mouse position
        const panePosition = project({
            x: event.clientX - left,
            y: event.clientY - top,
        });

        // we are calculating with positionAbsolute here because child nodes are positioned relative to their parent
        return {
            x: panePosition.x - parentNode.positionAbsolute.x + parentNode.width / 2,
            y: panePosition.y - parentNode.positionAbsolute.y + parentNode.height / 2,
        };
    };

    const onConnectStart: OnConnectStart = useCallback((_, { nodeId }) => {
        // we need to remember where the connection started so we can add the new node to the correct parent on connect end
        connectingNodeId.current = nodeId;
    }, []);

    const onConnectEnd: OnConnectEnd = useCallback(
        (event) => {
            const { nodeInternals } = store.getState();
            const targetIsPane = (event.target as Element).classList.contains(
                'react-flow__pane'
            );
            const node = (event.target as Element).closest('.react-flow__node');

            if (node) {
                node.querySelector('input')?.focus({ preventScroll: true });
            } else if (targetIsPane && connectingNodeId.current) {
                const parentNode = nodeInternals.get(connectingNodeId.current);
                const childNodePosition = getChildNodePosition(event as MouseEvent, parentNode);

                if (parentNode && childNodePosition) {
                    addChildNode(parentNode, childNodePosition);
                }
            }
        },
        [getChildNodePosition]
    );

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodeOrigin={nodeOrigin}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineStyle={connectionLineStyle}
            fitView
        >
            <Controls showInteractive={false} />
            <Panel position="top-left" className="header">
                React Flow Mind Map
            </Panel>
            <Background color="#ccc" variant={BackgroundVariant.Lines} />
            <MiniMap nodeStrokeWidth={3} />

        </ReactFlow>
    );
}

export default Flow;