import React, { FC, forwardRef, memo, useEffect, useRef } from 'react';
import SortableFC from 'react-sortablejs';
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
	pointsReady: boolean;
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
	pointsReady,
	selectedWeek,
	teamId,
	teamShort,
}): JSX.Element => {
	if (!pointsReady) return <></>;

	const disabledItems = disabledPoints.map(
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
	);
	const enabledItems = points.map(
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
	);
	const items = [...disabledItems, ...enabledItems];

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

	const PointList = forwardRef<HTMLUListElement>(
		({ children }, ref): JSX.Element => (
			<ul
				className={className}
				data-game-id={gameId}
				data-team-id={teamId}
				data-team-short={teamShort}
				ref={ref}
			>
				{children}
			</ul>
		),
	);

	PointList.displayName = 'PointList';

	return (
		<SortableFC
			className={className}
			options={{
				filter: '.disabled',
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
			}}
			tag={PointList}
		>
			{items}
		</SortableFC>
	);
};

PointHolder.whyDidYouRender = true;

export default PointHolder;
