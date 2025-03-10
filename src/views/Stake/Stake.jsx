import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  Link,
  OutlinedInput,
  Paper,
  SvgIcon,
  Tab,
  Tabs,
  Typography,
  Zoom,
} from "@material-ui/core";
import RebaseTimer from "../../components/RebaseTimer/RebaseTimer";
import TabPanel from "../../components/TabPanel";
import { getTokenImage, trim } from "../../helpers";
import { changeApproval, changeStake } from "../../slices/StakeThunk";
// import useMediaQuery from "@material-ui/core/useMediaQuery";
import "./stake.scss";
import { useWeb3Context } from "src/hooks/web3Context";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import { Skeleton } from "@material-ui/lab";
import { error } from "../../slices/MessagesSlice";
import { ethers } from "ethers";
import { addresses } from "src/constants";
import { ReactComponent as ArrowUp } from "src/assets/icons/arrow-up.svg";
import PoweredBy from "src/components/PoweredBy";

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function Stake() {
  const dispatch = useDispatch();
  const { provider, address, connect, chainID } = useWeb3Context();

  const [zoomed, setZoomed] = useState(false);
  const [view, setView] = useState(0);
  const [quantity, setQuantity] = useState("");

  const isAppLoading = useSelector(state => state.app.loading);
  const currentIndex = useSelector(state => {
    return state.app.currentIndex;
  });
  const fiveDayRate = useSelector(state => {
    return state.app.fiveDayRate;
  });

  const mnfstBalance = useSelector(state => {
    return state.account.balances && state.account.balances.mnfst;
  });
  const smnfstBalance = useSelector(state => {
    return state.account.balances && state.account.balances.smnfst;
  });
  const stakeAllowance = useSelector(state => {
    return state.account.staking && state.account.staking.mnfstStake;
  });
  const unstakeAllowance = useSelector(state => {
    return state.account.staking && state.account.staking.mnfstUnstake;
  });
  const stakingRebase = useSelector(state => {
    return state.app.stakingRebase;
  });
  const stakingAPY = useSelector(state => {
    return state.app.stakingAPY;
  });
  const stakingTVL = useSelector(state => {
    return state.app.stakingTVL;
  });

  const pendingTransactions = useSelector(state => {
    return state.pendingTransactions;
  });

  const setMax = () => {
    if (view === 0) {
      setQuantity(mnfstBalance);
    } else {
      setQuantity(smnfstBalance);
    }
  };

  const onSeekApproval = async token => {
    await dispatch(changeApproval({ address, token, provider, networkID: chainID }));
  };

  const onChangeStake = async action => {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(quantity) || quantity === 0 || quantity === "") {
      // eslint-disable-next-line no-alert
      return dispatch(error("Please enter a value!"));
    }

    // 1st catch if quantity > balance
    let gweiValue = ethers.utils.parseUnits(quantity, "gwei");
    if (action === "stake" && gweiValue.gt(ethers.utils.parseUnits(mnfstBalance, "gwei"))) {
      return dispatch(error("You cannot stake more than your MNFST balance."));
    }

    if (action === "unstake" && gweiValue.gt(ethers.utils.parseUnits(smnfstBalance, "gwei"))) {
      return dispatch(error("You cannot unstake more than your sMNFST balance."));
    }

    await dispatch(changeStake({ address, action, value: quantity.toString(), provider, networkID: chainID }));
  };

  const hasAllowance = useCallback(
    token => {
      if (token === "mnfst") return stakeAllowance > 0;
      if (token === "smnfst") return unstakeAllowance > 0;
      return 0;
    },
    [stakeAllowance, unstakeAllowance],
  );

  const isAllowanceDataLoading = (stakeAllowance == null && view === 0) || (unstakeAllowance == null && view === 1);

  let modalButton = [];

  modalButton.push(
    <Button variant="contained" color="primary" className="connect-button" onClick={connect} key={1}>
      Connect Wallet
    </Button>,
  );

  const changeView = (event, newView) => {
    setView(newView);
  };

  const trimmedBalance = Number(smnfstBalance).toFixed(4);

  const trimmedStakingAPY = trim(stakingAPY * 100, 1);
  const stakingRebasePercentage = trim(stakingRebase * 100, 4);
  const nextRewardValue = trim((stakingRebasePercentage / 100) * trimmedBalance, 4);

  return (
    <div id="stake-view">
      <>
        <Zoom in={true} onEntered={() => setZoomed(true)}>
          <Paper className={`ohm-card`}>
            <Grid container direction="column" spacing={2}>
              <Grid item>
                <div className="card-header">
                  <Typography variant="h5">Single Stake (💜,🌌)</Typography>
                  <RebaseTimer />
                </div>
              </Grid>

              <Grid item>
                <div className="stake-top-metrics">
                  <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={4} md={4} lg={4}>
                      <div className="stake-apy">
                        <Typography variant="h5" color="textSecondary">
                          APY
                        </Typography>
                        <Typography variant="h4">
                          {stakingAPY ? (
                            <>{new Intl.NumberFormat("en-US").format(trimmedStakingAPY)}%</>
                          ) : (
                            <Skeleton width="150px" />
                          )}
                        </Typography>
                      </div>
                    </Grid>

                    <Grid item xs={12} sm={4} md={4} lg={4}>
                      <div className="stake-tvl">
                        <Typography variant="h5" color="textSecondary">
                          Total Value Deposited
                        </Typography>
                        <Typography variant="h4">
                          {stakingTVL ? (
                            new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              maximumFractionDigits: 0,
                              minimumFractionDigits: 0,
                            }).format(stakingTVL)
                          ) : (
                            <Skeleton width="150px" />
                          )}
                        </Typography>
                      </div>
                    </Grid>

                    <Grid item xs={12} sm={4} md={4} lg={4}>
                      <div className="stake-index">
                        <Typography variant="h5" color="textSecondary">
                          Current Index
                        </Typography>
                        <Typography variant="h4">
                          {currentIndex ? <>{trim(currentIndex, 1)} MNFST</> : <Skeleton width="150px" />}
                        </Typography>
                      </div>
                    </Grid>
                  </Grid>
                </div>
              </Grid>

              <div className="staking-area">
                {!address ? (
                  <div className="stake-wallet-notification">
                    <div className="wallet-menu" id="wallet-menu">
                      {modalButton}
                    </div>
                  </div>
                ) : (
                  <>
                    <Box className="stake-action-area">
                      <Tabs
                        key={String(zoomed)}
                        centered
                        value={view}
                        textColor="primary"
                        indicatorColor="primary"
                        className="stake-tab-buttons"
                        onChange={changeView}
                        aria-label="stake tabs"
                      >
                        <Tab label="Stake" {...a11yProps(0)} />
                        <Tab label="Unstake" {...a11yProps(1)} />
                      </Tabs>

                      <Box className="stake-action-row " display="flex" alignItems="center">
                        {address && !isAllowanceDataLoading ? (
                          (!hasAllowance("mnfst") && view === 0) || (!hasAllowance("smnfst") && view === 1) ? (
                            <Box className="help-text">
                              <Typography variant="body1" className="stake-note" color="textSecondary">
                                {view === 0 ? (
                                  <>
                                    First time staking <b>MNFST</b>?
                                    <br />
                                    Please approve Manifest to use your <b>MNFST</b> for staking.
                                  </>
                                ) : (
                                  <>
                                    First time unstaking <b>sMNFST</b>?
                                    <br />
                                    Please approve Manifest to use your <b>sMNFST</b> for unstaking.
                                  </>
                                )}
                              </Typography>
                            </Box>
                          ) : (
                            <FormControl className="ohm-input" variant="outlined" color="primary">
                              <InputLabel htmlFor="amount-input"></InputLabel>
                              <OutlinedInput
                                id="amount-input"
                                type="number"
                                placeholder="Enter an amount"
                                className="stake-input"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                labelWidth={0}
                                endAdornment={
                                  <InputAdornment position="end">
                                    <Button variant="text" onClick={setMax} color="inherit">
                                      Max
                                    </Button>
                                  </InputAdornment>
                                }
                              />
                            </FormControl>
                          )
                        ) : (
                          <Skeleton width="150px" />
                        )}

                        <TabPanel value={view} index={0} className="stake-tab-panel">
                          {isAllowanceDataLoading ? (
                            <Skeleton />
                          ) : address && hasAllowance("mnfst") ? (
                            <Button
                              className="stake-button"
                              variant="contained"
                              color="primary"
                              disabled={isPendingTxn(pendingTransactions, "staking")}
                              onClick={() => {
                                onChangeStake("stake");
                              }}
                            >
                              {txnButtonText(pendingTransactions, "staking", "Stake MNFST")}
                            </Button>
                          ) : (
                            <Button
                              className="stake-button"
                              variant="contained"
                              color="primary"
                              disabled={isPendingTxn(pendingTransactions, "approve_staking")}
                              onClick={() => {
                                onSeekApproval("mnfst");
                              }}
                            >
                              {txnButtonText(pendingTransactions, "approve_staking", "Approve")}
                            </Button>
                          )}
                        </TabPanel>
                        <TabPanel value={view} index={1} className="stake-tab-panel">
                          {isAllowanceDataLoading ? (
                            <Skeleton />
                          ) : address && hasAllowance("smnfst") ? (
                            <Button
                              className="stake-button"
                              variant="contained"
                              color="primary"
                              disabled={isPendingTxn(pendingTransactions, "unstaking")}
                              onClick={() => {
                                onChangeStake("unstake");
                              }}
                            >
                              {txnButtonText(pendingTransactions, "unstaking", "Unstake MNFST")}
                            </Button>
                          ) : (
                            <Button
                              className="stake-button"
                              variant="contained"
                              color="primary"
                              disabled={isPendingTxn(pendingTransactions, "approve_unstaking")}
                              onClick={() => {
                                onSeekApproval("smnfst");
                              }}
                            >
                              {txnButtonText(pendingTransactions, "approve_unstaking", "Approve")}
                            </Button>
                          )}
                        </TabPanel>
                      </Box>
                    </Box>

                    <div className={`stake-user-data`}>
                      <div className="data-row">
                        <Typography variant="body1">Your Balance</Typography>
                        <Typography variant="body1">
                          {isAppLoading ? <Skeleton width="80px" /> : <>{trim(mnfstBalance, 4)} MNFST</>}
                        </Typography>
                      </div>

                      <div className="data-row">
                        <Typography variant="body1">Your Staked Balance</Typography>
                        <Typography variant="body1">
                          {isAppLoading ? <Skeleton width="80px" /> : <>{trimmedBalance} sMNFST</>}
                        </Typography>
                      </div>

                      <div className="data-row">
                        <Typography variant="body1">Next Reward Amount</Typography>
                        <Typography variant="body1">
                          {isAppLoading ? <Skeleton width="80px" /> : <>{nextRewardValue} sMNFST</>}
                        </Typography>
                      </div>

                      <div className="data-row">
                        <Typography variant="body1">Next Reward Yield</Typography>
                        <Typography variant="body1">
                          {isAppLoading ? <Skeleton width="80px" /> : <>{stakingRebasePercentage}%</>}
                        </Typography>
                      </div>

                      <div className="data-row">
                        <Typography variant="body1">ROI (5-Day Rate)</Typography>
                        <Typography variant="body1">
                          {isAppLoading ? <Skeleton width="80px" /> : <>{trim(fiveDayRate * 100, 4)}%</>}
                        </Typography>
                      </div>

                      <div className="data-row">
                        <Link
                          href={`https://${chainID === 4 ? "rinkeby." : ""}etherscan.io/address/${
                            addresses[chainID].STAKING_ADDRESS
                          }`}
                          target="_blank"
                          rel="norefer"
                        >
                          <Typography variant="body1">
                            Staking Contract
                            <SvgIcon
                              component={ArrowUp}
                              style={{ verticalAlign: "middle", fontSize: "inherit", marginLeft: "2px" }}
                            />
                          </Typography>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Grid>
          </Paper>
        </Zoom>
        <PoweredBy />
      </>
    </div>
  );
}

export default Stake;
