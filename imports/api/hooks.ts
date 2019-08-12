import { useEffect, useRef } from 'react';

export const useInterval = (callback: () => void, delay: number): void => {
	const savedCallback = useRef<() => void>();

	useEffect((): void => {
		savedCallback.current = callback;
	}, [callback]);

	useEffect((): (() => void) | undefined => {
		const tick = (): void => {
			if (savedCallback.current) savedCallback.current();
		};

		if (delay !== null) {
			let id = setInterval(tick, delay);

			return (): void => clearInterval(id);
		}
	}, [delay]);
};
