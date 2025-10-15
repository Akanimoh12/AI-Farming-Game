import { ConnectButton as RainbowKitConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@components/common'

export function ConnectButton() {
  return (
    <RainbowKitConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal} variant="primary">
                    Connect Wallet
                  </Button>
                )
              }

              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} variant="danger">
                    Wrong Network
                  </Button>
                )
              }

              return (
                <div className="flex items-center gap-2">
                  <Button onClick={openChainModal} variant="ghost" size="sm">
                    {chain.hasIcon && chain.iconUrl && (
                      <img
                        alt={chain.name ?? 'Chain icon'}
                        src={chain.iconUrl}
                        className="h-4 w-4"
                      />
                    )}
                    {chain.name}
                  </Button>

                  <Button onClick={openAccountModal} variant="outline">
                    {account.displayName}
                    {account.displayBalance && ` (${account.displayBalance})`}
                  </Button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </RainbowKitConnectButton.Custom>
  )
}
