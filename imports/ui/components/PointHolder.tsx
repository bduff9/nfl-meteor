import React, { FC, memo, useEffect, useRef } from 'react';
import Sortable from 'sortablejs';

import { setPick } from '../../api/collections/picks';
import { TWeek, TGameNumber } from '../../api/commonTypes';
import { getColor, handleError } from '../../api/global';

export type TPointHolderProps = {
	className: string;
	disabledPoints: number[];
	gameId?: string;
	league: string;
	numGames: number;
	points: number[];
	selectedWeek: TWeek;
	teamId?: string;
	teamShort?: string;
};

const PointHolder: FC<TPointHolderProps> = ({
	className,
	disabledPoints,
	gameId,
	league,
	numGames,
	points,
	selectedWeek,
	teamId,
	teamShort,
}): JSX.Element => {
	const sortableInstance = useRef<Sortable | null>(null);
	const pointBankRef = useRef<HTMLUListElement>(null);

	const _handlePointAdd = (ev: Sortable.SortableEvent): void => {
		const { from, item, to } = ev;
		const pointVal = parseInt(item.innerText, 10);
		const addOnly = Sortable.utils.is(from, '.pointBank');
		const removeOnly = Sortable.utils.is(to, '.pointBank');

		setPick.call(
			{
				addOnly,
				fromData: from.dataset,
				league,
				pointVal,
				removeOnly,
				selectedWeek,
				toData: to.dataset,
			},
			handleError,
		);
		// Fix for removeChild error
		item.style.display = 'none';
		from.appendChild(item);
	};

	const _validatePointDrop = (ev: Sortable.MoveEvent): boolean => {
		const { dragged, to } = ev;

		if (Sortable.utils.is(to, '.pointBank')) return true;

		if (Sortable.utils.is(to, '.disabled')) return false;

		if (to.children.length > 0) return false;

		const closestRow = Sortable.utils.closest(to, '.row');

		if (!closestRow) return false;

		const usedPoints = Array.from(Sortable.utils.find(closestRow, 'li')).filter(
			(point): boolean =>
				Sortable.utils.is(point, '.points') && point !== dragged,
		);

		return usedPoints.length === 0;
	};

	useEffect((): void => {
		const opts: Sortable.Options = {
			filter: '.disabled',
			forceFallback: true,
			group: 'picks',
			onAdd: _handlePointAdd,
			onMove: _validatePointDrop,
			onStart: (): void => {
				document.ontouchmove = (ev): void => ev.preventDefault();
			},
			onEnd: (): void => {
				document.ontouchmove = (): true => true;
			},
			scroll: false,
			sort: false,
		};

		if (pointBankRef.current)
			sortableInstance.current = Sortable.create(pointBankRef.current, opts);

		const listToDisable = document.querySelectorAll('.points'); //needed for IOS devices on Safari browser (FIX)

		if (listToDisable) {
			listToDisable.forEach(
				(item): void => {
					item.addEventListener(
						'touchstart',
						(event): void => {
							event.preventDefault();
						},
					);
				},
			);
		}

		window.addEventListener(
			'touchmove',
			(): void => {
				return;
			},
			{ passive: false },
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<ul
			className={className}
			data-game-id={gameId}
			data-team-id={teamId}
			data-team-short={teamShort}
			ref={pointBankRef}
		>
			{disabledPoints.map(
				(point): JSX.Element => (
					<li
						className="points text-center disabled"
						data-id={point}
						style={getColor(point as TGameNumber, numGames as TGameNumber)}
						key={`point-${point}`}
					>
						{point}
					</li>
				),
			)}
			{points.map(
				(point): JSX.Element => (
					<li
						className="points text-center"
						data-id={point}
						style={getColor(point as TGameNumber, numGames as TGameNumber)}
						key={`point-${point}`}
					>
						{point}
					</li>
				),
			)}
		</ul>
	);
};

PointHolder.whyDidYouRender = true;

export default memo(PointHolder);
