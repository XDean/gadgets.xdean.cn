import {AllTilesView} from "./AllTiles";
import {HandView} from "./Hand";
import React, {useCallback, useEffect, useState} from "react";
import {Chi, Gang, Hand, Peng, Tiles} from "../core/type";
import clsx from "clsx";
import {FanView} from "./Fan";
import {Tile, TileNumberTypes, TilePoint} from "../core/tile";
import {OptionView} from "./Option";
import {GithubComment} from "../../../util/GithubComment";
import {motion} from "framer-motion";
import {OpacityInOut} from "../../../../motion/OpacityInOut";
import {MySeo} from "../../../util/Seo";
import Head from 'next/head'
import {register} from "../../../../util/register_workbox";

type Mode = {
  name: string
  label: string
  add: (hand: Hand, tile: Tile) => void
  disableAll: (hand: Hand) => boolean
  disable: (hand: Hand) => Tiles
}
const modes: Mode[] = [
  {
    name: 'normal',
    label: '立牌',
    add: (h, t) => h.tiles.tiles.push(t),
    disableAll: hand => hand.count === 14,
    disable: hand => hand.usedTiles.filterMoreThan(3),
  }, {
    name: 'chi',
    label: '吃',
    add: (h, t) => h.mings.push(new Chi(t)),
    disableAll: hand => hand.count >= 12,
    disable: hand => new Tiles([...Tile.Z, ...hand.usedTiles.filterType(...TileNumberTypes).filterMoreThan(3).tiles
      .flatMap(t => [0, 1, 2]
        .map(d => t.point - d)
        .filter(p => p > 0)
        .map(p => new Tile(t.type, p as TilePoint)))])
  },
  {
    name: 'peng',
    label: '碰',
    add: (h, t) => h.mings.push(new Peng(t)),
    disableAll: hand => hand.count >= 12,
    disable: hand => hand.usedTiles.filterMoreThan(1)
  },
  {
    name: 'ming-gang',
    label: '明杠',
    add: (h, t) => h.mings.push(new Gang(t, true)),
    disableAll: hand => hand.count >= 12,
    disable: hand => hand.usedTiles.distinct
  },
  {
    name: 'an-gang',
    label: '暗杠',
    add: (h, t) => h.mings.push(new Gang(t, false)),
    disableAll: hand => hand.count >= 12,
    disable: hand => hand.usedTiles.distinct
  },
]

export const GuoBiaoMainView = () => {
  const [hand, setHand] = useState(new Hand(new Tiles([]), []))
  const [mode, setMode] = useState(modes[0])
  const [disableAll, setDisableAll] = useState(false)
  const [disabledTiles, setDisabledTiles] = useState(new Tiles([]))

  useEffect(() => register({
    scope: '/tools/guobiao',
    start_url: '/tools/guobiao',
    sw: '/tools/guobiao-sw.js',
  }), [])

  useEffect(() => {
    setDisableAll(mode.disableAll(hand))
    const tiles = mode.disable(hand);
    if (!disabledTiles.equals(tiles)) {
      setDisabledTiles(tiles)
    }
  }, [mode, hand])

  const updateHand = useCallback((f: (h: Hand) => void) => {
    const copy = hand.copy();
    f(copy)
    setHand(copy)
  }, [hand])

  const onTileClick = useCallback((t: Tile) => updateHand(h => mode.add(h, t)), [mode, updateHand]);
  const onHandMingClick = useCallback(i => updateHand(h => h.mings.splice(i, 1)), [updateHand]);
  const onHandTileClick = useCallback(i => updateHand(h => h.tiles.tiles.splice(i, 1)), [updateHand]);
  const onOptionsChange = useCallback(o => updateHand(h => h.option = o), [updateHand]);

  return (
    <motion.div className={'w-max max-w-screen-lg'} {...OpacityInOut}>
      <Head>
        <link rel='manifest' href='/tools/guobiao/manifest.json'/>
      </Head>
      <MySeo
        title={'国标麻将算番器'}
        description={'国标麻将在线算番工具'}
        noindex={false}
        openGraph={{
          type: 'website',
          images: [{
            url: '/tools/guobiao/logo_192.webp',
            width: 192,
            height: 192,
          }],
        }}
      />
      <AllTilesView
        disableAll={disableAll}
        disabledTiles={disabledTiles}
        onTileClick={onTileClick}/>
      <div className={'text-lg md:text-2xl my-2 flex flex-row items-center justify-between'}>
        {modes.map(m => (
          <button key={m.name} onClick={e => setMode(m)}
                  className={clsx('px-1 md:px-2 py-1 rounded-lg border-2 w-14 md:w-20 border-opacity-0',
                    {'border-blue-500 shadow-lg border-opacity-100': mode === m})}>
            {m.label}
          </button>
        ))}
      </div>
      <HandView hand={hand}
                onMingClick={onHandMingClick}
                onTileClick={onHandTileClick}/>
      <OptionView options={hand.option} onOptionsChange={onOptionsChange}/>
      <FanView hand={hand}/>
      <hr className={'mt-4'}/>
      <GithubComment/>
    </motion.div>
  )
}