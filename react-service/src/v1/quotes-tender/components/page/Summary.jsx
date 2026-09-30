import React from 'react';
import { connect } from 'react-redux';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import isNaN from 'lodash/isNaN';
import { CONSTANTS } from 'clink-components';
import { numToPrice, numToPercent } from 'v1/quotes-tender/helpers/price';
import { Profit, BudgetCost, BudgetCostPerSquareFeet } from './CustomIcons';

const { clinkGreen, clinkRed } = CONSTANTS.colors.general;
const imgBase64 = {
  forecast:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAbCAYAAAAZMl2nAAAABHNCSVQICAgIfAhkiAAAA4VJREFUSEu9VltIFFEYPv+ut5XaNRJToqeyC0X0EBXddLai6CEsKAq6PVSWps6MGkFFQxRE1uy4omBaFF0goaiIsNuOBhX1EAT5EAUhmkUFoQ9pWzunb2Z3YXXdXJd2z8tczjn/953v/85/DrEUNUXhtpycjvWiKNwbDZJSwcOr+ooCjDUS0VxGfJ0ouh+MxE0qEa/3yXQjQCpjtCECuNfgmTNleelgJJmkEGk+/cg1mGE/zogOAix95Oo5Y6ckSTiaVCIeT8c2YkYDVJgcO+38l/2PfU5FbdHH8Jj/roim+XYyTpfDAJzzLssbZuNsiBHLsl45uyPJQknSiJiBNVV/zRkfsHNWZdhIwS8LECnZiJVfxOuk0PcapOix+f7fFTGDnj2r59bUCN/PneucZrcZ3UEc/k6U3LM9Hn0PPlpCSjSLkrA/aUTCcgP0JECPBFdPlZJU3IBUkebR24nTFbFauBp3asyJTXUdU8oPCV9imy+6R1G6MlzOr5+IWC78MJjt/1NQenhNf6wYY6YGq1pNjLdD3VsoRheqqoSHMB/S/e8W3D38etCkvEWU3fv+NSMOIr6bxGhTRJBe6Nz8O5BxvrZ22ddYwTXV9wx1ZKnZbzP4gspq95uEiQw32/AwSJkBC94GTKsoFrVHqqRpT+czHrCAId0L7AyLUMJEPB7fCahxLCRvEydyQcIt+B5WLUGq29yW9vSM1oqK5X2Y14x5VipAZDuIXEuYiKLoaTlO1oNV5wPIn5mVnl9WtuJHXd2zvLQ0/14ELgd4QSSAqRKUuQtzroVJHXh+7x/Im6ooc/0JE9G0js0wWVvQa+wyquDuyGBtbW32vp7cEvjgAMiuGhWIcy9MWjUWCbM/plmx13X0F1tBiC/B0f0yVsD6+s5CI2CUg/JuKOIKjzO4fbEsr3yVMBFV1WfYiL0PqsG7JNk9L55gqvrcQTS0A8Yow3gH5s2KZ15MRbD16iF5Zchse2G21ngDhsc1ntHzx1MEo1Lj9d7PNAJZqA/khB4DjmxnQWnpwp/jJTLe8VFEIg8lnKANkuS2lEl2iyai+t6G7w8GZ4WyLHxINokoj6jq00U2Cli7AybthNmCuyYFbZgiHlW/hEK0y8IlthVX/xsp4BCCCyGZldTlZJ/NYxu/vjmyJ06FSX+nnIgJ2NioT/D72VZCoRari8O3qJRwGfMakBIWAPkLGyNFK29fVaoAAAAASUVORK5CYII=',
  percent_down:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAYAAAAfrhY5AAAABHNCSVQICAgIfAhkiAAAAzBJREFUSEvtVktoE2EQntlN0lduYjZNAhVS8KL1KNKCFqyth1oPLVpToQ9EFMQniAVBEL0pFi9e2qpNqKVC1YvW9iK0B48WDxUb8NC0mxY9VZvnjvNvsjWpMcmq8WIXQnb/mf//vpn5ZnYR0ld0ePpWErTuCrB6sacxYqyX8h/F4dFH0+0akZ9vP/NvrrzG0oqNjYlSAouzMTI83UJIE4gwQklqAAmQAN5X1Fg7S00A14enHksSviCi7QR0tpysTRFMjEuknSrraZ4vZfR62sUVeTh1RoBXdB/aXUrAzLO3wP/rtL8+QoRtFT1NfZmiCLt89SThFV47CkSzQDDkXAoMZfk4OhWyybOg0e3Ntnzi3RBcLqc08AzbggD0hoF3AmI9P19wLvoHjD2qxzcobM5QoMFMp+QFVz1dEyJijMVrlZWxoKqcrAKLNqkTiKPdGR75ahBESO5RFkfn/iY4DzsAjnKDpB4lYK8Ao7glCFZ6xy73MzNRLIG8kS+7u+7w2L3EtewTtQx7OusIZAEWZLBa3Q60FxJSs8hCsaCGX/6aO455yWadZGdv1mRKai0g07Iggho1KEuBWbPA+oul0KZwSsnHWXB1SPgJMPlcTzfXngDfVof8lwud8St7QfBcG1mI53n9HItuD1oTXiC5jd+MOziWOYwlnygro+FiCJkGN+ou0s19bydZerUJKMjd0Sy6oxAB0+Cp9qMvzsVAH98vCD0Ybaa6fL0g4SAR3C2mHKbA04f3c2rrwQZKSvk0JIj8GDhdP7XnH9c8nFL+gkTU4QgFnqaFqOojN91qho9Y2zztwq4TBwEku7Lkf1ZUq2UyTg0XMXCyohTCu6cTQPjAgtuvlyFH+3HWBgjBVR0KdJgCX3H72jXEcWPMZpFK1blfnwVMgj8Ar+bq+98GL6TaYuxb4KZrXkxac/kQdMiqp+y6HI0+0Ky2a0JwlRg7vU62i0oodtNUn5slQXBDUt0fx3jfLu6AGf4O2EaINfz8zRmyNJUUXJAlOGBR3e5RiWAfA0d4Ai3Lsehhx+r4WsnBNwh4PPMcvV2Kx2oFsFj/J+ApAq2Vqj1RVb32ctUo33dXW5TweVSqogAAAABJRU5ErkJggg==',
  percent_up:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAYAAAAfrhY5AAAABHNCSVQICAgIfAhkiAAAAytJREFUSEvtV01IVGEUvfeNBU4zQaQFGrRQyZqCCNIiN5KGI2gLx6BVaiNSLcqVKEQT0UJalLvCSe0HImesMHAijFwYyLiJyNGNtCkLoo2WtnDe7XzjPHkNo/NeNauczcx73/2+c+6959z3hin58Q71Xiedm5byHEVjlc0/jfvZ/GZ1OIB9pNNDIfqmEb9bzCuqG6usXM4msDqba58EayROT4npAZFUgA2L0PulvOLT2SbAteHgfWEZJqF8Jj5PuqNaOB6Kc7z1pa9tJpvZJ8qeKH2495wCH/H5D2QT0Hz2Bvh/XPaaobv18NjJiM9/1iyKmnDwDAt1MtMeWHAOlgwh5pI55kT4TmkOOaKYE32pa+uJd1Vw6YIUsEY0gLUFIZkh4UKQKMD1AFzRbHJKVK1FGv2FdpyyLrg3FJxJZMxUEWnwv/EO9uUT628VAdG1HZFTLV8Ngsi6Hlk//2fgGEA4kwhZmi0ZxTw4rMBI1yZY02cRMmSuhFUCmTIfRZbHAdSjeukNB+uwYVi1AWBbUZlR/N5Loh1UVbAKasStDz4UPAaxRRDsNh8sIu3EPKuI6ERNL3z+e3aBEw+WTJuSSu6A4DyY/x8B2q/KrXqPvdMQWVWmM9ZazwiebiO00I/7DRBdEWn6ERJpRhq7oIWpZYp3W30g2QY3+q7KjbmwjZlvphBcgDu8yh2ZKmIfHPbDE38+4mstQwXmlR4Mm4HYLRx4EcPolZV22AJPHt6C0pY5yFGiBActTCoiRpbp7PnXPfeuKH8c/b060tgaSApxOjFyk1YzYtS91Gl3IzZZpZPu6thX/syS1cyM8bIRVdcpWSrhNa3MfPkEwZWqNqSzX/fURA/MVdDhKW+0BV4b6g3AYleMMfs7qUSfWxK9BwnEdKXz/R+DZ1KtlfUNcNs9t1LWdDGDIo4PsehlCPG2kN6pBLeJ4m3LorUvsvuaLZ/bJREQ0XJj0ceYhPuFeJw13k6i78ZQWlxy7qzOKrgiG5DXObkx5yOM4aMicfwH5M8ucnsveDzfsw6+SmDKiX8/4nKxu1gBW3qk2i31WvGBuTnn5h9ftnSVHFp96fgFDXZwpU33Lr8AAAAASUVORK5CYII=',
};

const summaryLabels = (code) => ({
  budget: {
    label: 'Budget Cost',
    itemType: 'currency',
    icon: <BudgetCost />,
  },
  forecast: {
    label: 'Forecast Cost',
    itemType: 'currency',
    icon: <img src={imgBase64.forecast} alt="Forecast Cost" />,
  },
  profit_loss: {
    label: 'Profit / Loss',
    itemType: 'currency',
    icon: {
      positive: <Profit color={clinkGreen} down={false} />,
      negative: <Profit />,
    },
  },
  profit_loss_percent: {
    label: 'Profit / Loss',
    itemType: 'percent',
    icon: {
      positive: <img src={imgBase64.percent_up} alt="Profit / Loss" />,
      negative: <img src={imgBase64.percent_down} alt="Profit / Loss" />,
    },
  },
  budget_cost: {
    label: `Budget Cost per ${code === 'UK' ? 'ft²' : 'm²'}`,
    itemType: 'area',
    icon: <BudgetCostPerSquareFeet code={code} />,
  },
  forecast_cost_per_ft2: {
    label: `Forecast Cost per ${code === 'UK' ? 'ft²' : 'm²'}`,
    itemType: 'area',
    icon: <BudgetCostPerSquareFeet code={code} />,
  },
});

const SummaryItemComp = ({ itemKey, value, clinkAccount }) => {
  const color = value < 0 ? { color: clinkRed } : { color: clinkGreen };
  const { label, itemType, icon } = summaryLabels(clinkAccount?.country?.code)[
    itemKey
  ];
  const summaryValue = () => {
    let num;
    if (isNaN(value)) {
      return 0;
    }
    if (itemType === 'currency' || itemType === 'area') {
      num = numToPrice(value);
    } else if (itemType === 'percent') {
      num = numToPercent(value);
    } else {
      num = value;
    }
    return num;
  };

  let theIcon = icon;
  if (Object.prototype.hasOwnProperty.call(icon, 'positive')) {
    theIcon = value < 0 ? icon.negative : icon.positive;
  }

  return (
    <Grid
      container
      flexDirection="column"
      justifyContent="space-evenly"
      size={{ xs: 12, sm: 6, md: 2 }}
    >
      <Grid>{theIcon}</Grid>
      <Grid>
        <Typography variant="title">{label}</Typography>
      </Grid>
      <Grid sx={color}>
        <Typography variant="title2" fontWeight={600}>
          {summaryValue()}
        </Typography>
      </Grid>
    </Grid>
  );
};
const mapStateToProps = (state) => {
  return {
    clinkAccount: state.clinkAccount,
  };
};

const SummaryItem = connect(mapStateToProps)(SummaryItemComp);

const Summary = ({ summary, gia }) => {
  const { budget, forecast, profit_loss } = summary;
  const projectSummary = {
    budget,
    forecast,
    profit_loss,
    profit_loss_percent:
      budget && forecast
        ? (((budget - forecast) / budget) * 100).toFixed(2)
        : 0,
    budget_cost: budget > 0 && gia > 0 ? (budget / 100 / gia).toFixed(2) : 0,
    forecast_cost_per_ft2: gia > 0 ? (forecast / 100 / gia).toFixed(2) : 0,
  };

  return (
    <Grid
      component={Paper}
      container
      justifyContent="space-between"
      p={2}
      mb={2}
    >
      {summary &&
        Object.keys(projectSummary).map((item) => (
          <SummaryItem key={item} itemKey={item} value={projectSummary[item]} />
        ))}
    </Grid>
  );
};

export default Summary;
