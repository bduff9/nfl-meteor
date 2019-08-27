import React, { FC, memo, useEffect, useRef } from 'react';
import Sortable, {
	create,
	MoveEvent,
	Options,
	SortableEvent,
	utils,
} from 'sortablejs';

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

	const _handlePointAdd = (ev: SortableEvent): void => {
		const { from, item, to } = ev;
		const pointVal = parseInt(item.innerText, 10);
		const addOnly = utils.is(from, '.pointBank');
		const removeOnly = utils.is(to, '.pointBank');

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

	const _validatePointDrop = (ev: MoveEvent): boolean => {
		const { dragged, to } = ev;

		if (utils.is(to, '.pointBank')) return true;

		if (utils.is(to, '.disabled')) return false;

		if (to.children.length > 0) return false;

		const closestRow = utils.closest(to, '.row');

		if (!closestRow) return false;

		const usedPoints = Array.from(utils.find(closestRow, 'li')).filter(
			(point): boolean => utils.is(point, '.points') && point !== dragged,
		);

		return usedPoints.length === 0;
	};

	useEffect((): void => {
		const opts: Options = {
			group: 'picks',
			sort: false,
			filter: '.disabled',
			onAdd: _handlePointAdd,
			onMove: _validatePointDrop,
		};

		if (pointBankRef.current)
			sortableInstance.current = create(pointBankRef.current, opts);
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
