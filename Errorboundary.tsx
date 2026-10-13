import React from 'react';

// แสดงข้อความ error บนหน้าจอแทนหน้าขาว (React จะถอดทั้งแอปออกเมื่อ render error โดยไม่มีตัวดักจับ)
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
    state = { error: null as Error | null };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
                    <h2 style={{ color: '#b91c1c' }}>เกิดข้อผิดพลาดในหน้านี้</h2>
                    <pre style={{ whiteSpace: 'pre-wrap', background: '#fee2e2', padding: 12, borderRadius: 8 }}>
                        {String(this.state.error.stack || this.state.error.message)}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}